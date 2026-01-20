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
    $sql = "SELECT CAST(t.Id AS NVARCHAR(36)) as Id, t.Title, t.Description, t.Status, t.Priority, t.DueDate, t.CreatedAt, t.CompletedAt, t.UpdatedAt,
                   CAST(ta.UserId AS NVARCHAR(20)) as AssigneeId, au.Username as AssigneeName,
                   t.CreatedByUserId, cu.Username as CreatedByName
            FROM Tasks t
            LEFT JOIN TaskAssignments ta ON t.Id = ta.TaskId
            LEFT JOIN Users au ON ta.UserId = au.Id
            JOIN Users cu ON t.CreatedByUserId = cu.Id
            WHERE (t.CreatedByUserId = ? 
               OR EXISTS (SELECT 1 FROM TaskAssignments check_ta WHERE check_ta.TaskId = t.Id AND check_ta.UserId = ?))
               $archiveClause
            ORDER BY t.CreatedAt DESC";
            
            // Note: Params are still just 2 userIds. Archive clause is static string injection (safe as it's hardcoded logic, not user input directly)
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
                'assignees' => array(), // New array for multiple assignees
                // Keep backward compatibility if needed, but client should update
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
    echo json_encode(array("message" => "Missing userId."));
}
?>
