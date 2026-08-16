<?php
include_once '../config/db.php';

if(isset($_GET['userId'])) {
    $userId = $_GET['userId'];
    
    // Fetch tasks where I am an assignee OR the creator
    // We join TaskAssignments (ta) to get all assignees for the tasks I can see
    // Check for archive filter (only admins usually, but logic here)
    $showArchived = isset($_GET['showArchived']) && $_GET['showArchived'] === 'true';
    
    $archiveClause = "";
    if (!$showArchived) {
        // Hide Done tasks older than 15 days
        // We only hide if Status='Done' AND CompletedAt IS NOT NULL AND CompletedAt < 15 days ago.
        // If CompletedAt is NULL, we assume it's recent or legacy and show it (or fix it elsewhere).
        $archiveClause = " AND NOT (t.Status = 'Done' AND t.CompletedAt IS NOT NULL AND t.CompletedAt < DATEADD(day, -15, GETDATE()))";
    }

    // Fetch tasks where I am an assignee OR the creator
    // We join TaskAssignments (ta) to get all assignees for the tasks I can see
    $sql = "SELECT CAST(t.Id AS NVARCHAR(36)) as Id, t.Title, t.Description, t.Status, t.Priority, t.DueDate, t.CreatedAt, t.CompletedAt, t.UpdatedAt, CAST(t.ParentTaskId AS NVARCHAR(36)) as ParentTaskId,
                   CAST(ta.UserId AS NVARCHAR(20)) as AssigneeId, au.Username as AssigneeName,
                   t.CreatedByUserId, cu.Username as CreatedByName,
                   (SELECT COUNT(*) FROM Tasks st WHERE st.ParentTaskId = t.Id) as SubTasksCount,
                   (SELECT COUNT(*) FROM Tasks st WHERE st.ParentTaskId = t.Id AND st.Status = 'Done') as CompletedSubTasksCount,
                   (SELECT COUNT(*) FROM Tasks st WHERE st.ParentTaskId = t.Id AND st.Status = 'In Progress') as InProgressSubTasksCount
            FROM Tasks t
            LEFT JOIN TaskAssignments ta ON t.Id = ta.TaskId
            LEFT JOIN Users au ON ta.UserId = au.Id
            JOIN Users cu ON t.CreatedByUserId = cu.Id
            WHERE (t.CreatedByUserId = ? 
               OR EXISTS (SELECT 1 FROM TaskAssignments check_ta WHERE check_ta.TaskId = t.Id AND check_ta.UserId = ?))
               AND NOT EXISTS (SELECT 1 FROM Tasks pt WHERE pt.Id = t.ParentTaskId AND pt.Status IN ('Done', 'Completed'))
               $archiveClause
            ORDER BY t.CreatedAt DESC";
            
    $params = array($userId, $userId);
    $stmt = sqlsrv_query($conn, $sql, $params);
    
    if($stmt === false) {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }
    
    $tasksMap = array();
    
    while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $taskId = $row['Id'];
        
        if(!isset($tasksMap[$taskId])) {
            $subCount = (int)($row['SubTasksCount'] ?? 0);
            $completedSubCount = (int)($row['CompletedSubTasksCount'] ?? 0);
            $inProgressSubCount = (int)($row['InProgressSubTasksCount'] ?? 0);
            $progressPercentage = $subCount > 0 ? (int)round(($completedSubCount / $subCount) * 100) : 0;

            $tasksMap[$taskId] = array(
                'id' => $row['Id'],
                'title' => $row['Title'],
                'description' => $row['Description'],
                'status' => $row['Status'],
                'priority' => $row['Priority'],
                'dueDate' => isset($row['DueDate']) ? $row['DueDate']->format('Y-m-d H:i:s') : null,
                'createdAt' => $row['CreatedAt']->format('Y-m-d H:i:s'),
                'updatedAt' => isset($row['UpdatedAt']) ? $row['UpdatedAt']->format('Y-m-d H:i:s') : null,
                'completedAt' => isset($row['CompletedAt']) ? $row['CompletedAt']->format('Y-m-d H:i:s') : null,
                'parentTaskId' => $row['ParentTaskId'],
                'subTasksCount' => $subCount,
                'completedSubTasksCount' => $completedSubCount,
                'inProgressSubTasksCount' => $inProgressSubCount,
                'progressPercentage' => $progressPercentage,
                'assignees' => array(),
                'createdByUserId' => $row['CreatedByUserId'],
                'createdByName' => $row['CreatedByName']
            );
        }
        
        if($row['AssigneeId']) {
            $tasksMap[$taskId]['assignees'][] = array(
                'id' => $row['AssigneeId'],
                'name' => $row['AssigneeName']
            );
        }
    }
    
    // Attach sub-tasks for any parent task that has subTasksCount > 0
    $parentTaskIds = array();
    foreach ($tasksMap as $tid => $tdata) {
        if (!empty($tdata['subTasksCount']) && $tdata['subTasksCount'] > 0) {
            $parentTaskIds[] = $tid;
        }
    }

    if (!empty($parentTaskIds)) {
        $inClause = implode(',', array_fill(0, count($parentTaskIds), '?'));
        $subSql = "SELECT CAST(st.Id AS NVARCHAR(36)) as Id, st.Title, st.Status, st.Priority, CAST(st.ParentTaskId AS NVARCHAR(36)) as ParentTaskId,
                          u.Username as AssigneeName
                   FROM Tasks st
                   LEFT JOIN TaskAssignments ta ON st.Id = ta.TaskId
                   LEFT JOIN Users u ON ta.UserId = u.Id
                   WHERE st.ParentTaskId IN ($inClause)
                   ORDER BY st.CreatedAt ASC";
        $subStmt = sqlsrv_query($conn, $subSql, $parentTaskIds);
        if ($subStmt) {
            $subMap = array();
            while ($sRow = sqlsrv_fetch_array($subStmt, SQLSRV_FETCH_ASSOC)) {
                $pId = $sRow['ParentTaskId'];
                $stId = $sRow['Id'];
                if (!isset($subMap[$pId])) {
                    $subMap[$pId] = array();
                }
                if (!isset($subMap[$pId][$stId])) {
                    $subMap[$pId][$stId] = array(
                        'id' => $stId,
                        'title' => $sRow['Title'],
                        'status' => $sRow['Status'],
                        'priority' => $sRow['Priority'],
                        'assigneeName' => $sRow['AssigneeName']
                    );
                } else if ($sRow['AssigneeName'] && empty($subMap[$pId][$stId]['assigneeName'])) {
                    $subMap[$pId][$stId]['assigneeName'] = $sRow['AssigneeName'];
                }
            }
            foreach ($subMap as $pId => $stItems) {
                if (isset($tasksMap[$pId])) {
                    $tasksMap[$pId]['subTasks'] = array_values($stItems);
                }
            }
        }
    }

    echo json_encode(array_values($tasksMap));
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Missing userId."));
}
?>
