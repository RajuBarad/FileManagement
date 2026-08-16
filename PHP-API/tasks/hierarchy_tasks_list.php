<?php
include_once '../config/db.php';

if($_SERVER['REQUEST_METHOD'] == 'GET') {
    // Fetch all top-level parent tasks and their sub-tasks with assignee details
    $sql = "SELECT CAST(pt.Id AS NVARCHAR(36)) as ParentTaskId,
                   pt.Title as ParentTitle,
                   pt.Status as ParentStatus,
                   pt.Priority as ParentPriority,
                   cu.Username as ParentCreatorName,
                   CAST(st.Id AS NVARCHAR(36)) as SubTaskId,
                   st.Title as SubTaskTitle,
                   st.Status as SubTaskStatus,
                   st.Priority as SubTaskPriority,
                   st_au.Username as SubTaskAssigneeName
            FROM Tasks pt
            JOIN Users cu ON pt.CreatedByUserId = cu.Id
            LEFT JOIN Tasks st ON st.ParentTaskId = pt.Id
            LEFT JOIN TaskAssignments st_ta ON st.Id = st_ta.TaskId
            LEFT JOIN Users st_au ON st_ta.UserId = st_au.Id
            WHERE pt.ParentTaskId IS NULL
            ORDER BY pt.CreatedAt DESC, st.CreatedAt ASC";

    $stmt = sqlsrv_query($conn, $sql);

    if($stmt === false) {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }

    $parentsMap = array();
    while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $pId = $row['ParentTaskId'];
        if (!isset($parentsMap[$pId])) {
            $parentsMap[$pId] = array(
                "parentTaskId" => $pId,
                "parentTitle" => $row['ParentTitle'],
                "parentStatus" => $row['ParentStatus'],
                "parentPriority" => $row['ParentPriority'],
                "parentCreatorName" => $row['ParentCreatorName'],
                "totalSubTasks" => 0,
                "completedSubTasks" => 0,
                "subTasks" => array()
            );
        }

        if ($row['SubTaskId']) {
            $sId = $row['SubTaskId'];
            // Check if subtask already added (to prevent duplicates due to multiple assignees if any)
            $exists = false;
            foreach ($parentsMap[$pId]['subTasks'] as &$existingSub) {
                if ($existingSub['subTaskId'] === $sId) {
                    if ($row['SubTaskAssigneeName'] && !in_array($row['SubTaskAssigneeName'], $existingSub['assignees'])) {
                        $existingSub['assignees'][] = $row['SubTaskAssigneeName'];
                    }
                    $exists = true;
                    break;
                }
            }
            unset($existingSub);

            if (!$exists) {
                $assignees = $row['SubTaskAssigneeName'] ? array($row['SubTaskAssigneeName']) : array();
                $parentsMap[$pId]['subTasks'][] = array(
                    "subTaskId" => $sId,
                    "subTaskTitle" => $row['SubTaskTitle'],
                    "subTaskStatus" => $row['SubTaskStatus'],
                    "subTaskPriority" => $row['SubTaskPriority'],
                    "assignees" => $assignees
                );
            }
        }
    }

    // Calculate subtask counts & rates
    $result = array();
    foreach ($parentsMap as $p) {
        $totalSub = count($p['subTasks']);
        $completedSub = 0;
        foreach ($p['subTasks'] as $st) {
            if (in_array($st['subTaskStatus'], array('Done', 'Completed'))) {
                $completedSub++;
            }
        }
        $p['totalSubTasks'] = $totalSub;
        $p['completedSubTasks'] = $completedSub;
        $p['subTaskProgressRate'] = $totalSub > 0 ? (int)round(($completedSub / $totalSub) * 100) : 0;
        $result[] = $p;
    }

    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(array("message" => "Method not allowed."));
}
?>
