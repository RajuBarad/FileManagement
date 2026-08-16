<?php
include_once '../config/db.php';

if(isset($_GET['parentTaskId'])) {
    $parentTaskId = $_GET['parentTaskId'];

    $sql = "SELECT CAST(t.Id AS NVARCHAR(36)) as Id, t.Title, t.Description, t.Status, t.Priority, t.DueDate, t.CreatedAt, t.CompletedAt, t.UpdatedAt, CAST(t.ParentTaskId AS NVARCHAR(36)) as ParentTaskId,
                   CAST(ta.UserId AS NVARCHAR(20)) as AssigneeId, au.Username as AssigneeName,
                   t.CreatedByUserId, cu.Username as CreatedByName
            FROM Tasks t
            LEFT JOIN TaskAssignments ta ON t.Id = ta.TaskId
            LEFT JOIN Users au ON ta.UserId = au.Id
            JOIN Users cu ON t.CreatedByUserId = cu.Id
            WHERE t.ParentTaskId = ?
            ORDER BY t.CreatedAt ASC";

    $stmt = sqlsrv_query($conn, $sql, array($parentTaskId));

    if($stmt === false) {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }

    $tasksMap = array();

    while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $taskId = $row['Id'];

        if(!isset($tasksMap[$taskId])) {
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

    echo json_encode(array_values($tasksMap));
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Missing parentTaskId."));
}
?>
