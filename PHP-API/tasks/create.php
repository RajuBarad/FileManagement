<?php
include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(
    isset($data->title) && 
    isset($data->createdByUserId)
) {
    $title = $data->title;
    $description = isset($data->description) ? $data->description : '';
    $priority = isset($data->priority) ? $data->priority : 'Medium';
    $dueDate = isset($data->dueDate) ? $data->dueDate : null;
    $createdByUserId = $data->createdByUserId;
    
    // Support multiple assignees
    $assignedToUserIds = isset($data->assignedToUserIds) ? $data->assignedToUserIds : [];
    // If legacy assignedToUserId is sent, add it to array
    if(isset($data->assignedToUserId) && !in_array($data->assignedToUserId, $assignedToUserIds)) {
        $assignedToUserIds[] = $data->assignedToUserId;
    }
    
    // Use first assignee as "primary" for legacy column, or NULL
    $primaryAssignee = count($assignedToUserIds) > 0 ? $assignedToUserIds[0] : null;

    $sql = "INSERT INTO Tasks (Title, Description, Priority, DueDate, CreatedByUserId, AssignedToUserId) OUTPUT INSERTED.Id VALUES (?, ?, ?, ?, ?, ?)";
    $params = array($title, $description, $priority, $dueDate, $createdByUserId, $primaryAssignee);
    
    $stmt = sqlsrv_query($conn, $sql, $params);
    
    if($stmt) {
        $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
        $taskId = $row['Id'];
        
        // Insert Assignees & Send Emails
        include_once '../services/Mailer.php';
        include_once '../notifications/helper.php'; // Include Helper
        $mailer = new Mailer();
        
        // Fetch Creator Name
        $creatorName = "Unknown";
        $cStmt = sqlsrv_query($conn, "SELECT Username FROM Users WHERE Id = ?", array($createdByUserId));
        if($cStmt && $r = sqlsrv_fetch_array($cStmt)) { $creatorName = $r['Username']; }

        // 2. Assign Users
        foreach($assignedToUserIds as $assigneeId) {
            $assignSql = "INSERT INTO TaskAssignments (TaskId, UserId) VALUES (?, ?)";
            sqlsrv_query($conn, $assignSql, array($taskId, $assigneeId));
            
            // Get User Email (Username)
             $uStmt = sqlsrv_query($conn, "SELECT Username FROM Users WHERE Id = ?", array($assigneeId));
             if($uStmt && $uRow = sqlsrv_fetch_array($uStmt)) {
                $toEmail = $uRow['Username'];
                $mailer->sendTaskAssignment($toEmail, $title, $creatorName, $taskId);
                
                // Create Notification
                createNotification($conn, $assigneeId, "New Task Assigned", "You have been assigned to task: $title", "TaskAssignment", $taskId);
             }
        }
        
        http_response_code(201);
        echo json_encode(array("message" => "Task created successfully.", "id" => $taskId));
    } else {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
