<?php
include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->id) && isset($data->title)) {
    $id = $data->id;
    $title = $data->title;
    $description = isset($data->description) ? $data->description : '';
    $status = isset($data->status) ? $data->status : 'Pending';
    $priority = isset($data->priority) ? $data->priority : 'Medium';
    $dueDate = isset($data->dueDate) ? $data->dueDate : null;
    
    // Handle Assignments
    $assignedToUserIds = isset($data->assignedToUserIds) ? $data->assignedToUserIds : [];
    // If legacy assignedToUserId is sent, add it to array
    if(isset($data->assignedToUserId) && !in_array($data->assignedToUserId, $assignedToUserIds)) {
        $assignedToUserIds[] = $data->assignedToUserId;
    }
    
     // Use first assignee as "primary" for legacy column
    $primaryAssignee = count($assignedToUserIds) > 0 ? $assignedToUserIds[0] : null;

    // Check if status is being updated to 'Done'
    $completedAtClause = "";
    if (isset($data->status) && $data->status === 'Done') {
        $completedAtClause = ", CompletedAt = GETDATE()";
    } else if (isset($data->status) && $data->status !== 'Done') {
        $completedAtClause = ", CompletedAt = NULL";
    }

    $sql = "UPDATE Tasks SET Title = ?, Description = ?, Status = ?, Priority = ?, DueDate = ?, AssignedToUserId = ?, UpdatedAt = GETDATE() $completedAtClause WHERE Id = ?";
    $params = array($title, $description, $status, $priority, $dueDate, $primaryAssignee, $id);
    
    $stmt = sqlsrv_query($conn, $sql, $params);
    
    
    if($stmt) {
        // 1. Fetch Existing IDs to calculate diff
        $existingIds = [];
        $eStmt = sqlsrv_query($conn, "SELECT UserId FROM TaskAssignments WHERE TaskId = ?", array($id));
        while($r = sqlsrv_fetch_array($eStmt)) { $existingIds[] = $r['UserId']; }

        // 2. Update Assignments Table: Delete all and re-insert
        // Transaction would be better but keeping simple
        $delSql = "DELETE FROM TaskAssignments WHERE TaskId = ?";
        sqlsrv_query($conn, $delSql, array($id));
        
        include_once '../services/Mailer.php';
        $mailer = new Mailer();

        foreach($assignedToUserIds as $userId) {
            $assignSql = "INSERT INTO TaskAssignments (TaskId, UserId) VALUES (?, ?)";
            sqlsrv_query($conn, $assignSql, array($id, $userId));
            
            // 3. Email and Notify ONLY if NEWly assigned
            // Note: Data types might differ (string vs int), force simple comparison
            if(!in_array($userId, $existingIds)) { 
                $uStmt = sqlsrv_query($conn, "SELECT Username FROM Users WHERE Id = ?", array($userId));
                if($uStmt && $uRow = sqlsrv_fetch_array($uStmt)) {
                    $toEmail = $uRow['Username'];
                    // We don't have Assigner Name easy, just say "Task Manager"
                    $mailer->sendTaskAssignment($toEmail, $title, "Task Manager", $id);
                }
                
                // Add Notification
                include_once '../notifications/helper.php';
                createNotification($conn, $userId, "New Task Assigned", "You have been assigned to task: $title", "TaskAssignment", $id);
            }
        }

        http_response_code(200);
        echo json_encode(array("message" => "Task updated successfully."));
    } else {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
