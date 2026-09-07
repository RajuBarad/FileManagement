<?php
include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->taskId) && isset($data->status)) {
    $taskId = $data->taskId;
    $status = $data->status; // Pending, In Progress, Completed
    
    $completedAtClause = "";
    if ($status === 'Done') {
        $completedAtClause = ", CompletedAt = GETDATE()";
    } else {
        $completedAtClause = ", CompletedAt = NULL";
    }

    $sql = "UPDATE Tasks SET Status = ?, UpdatedAt = GETDATE() $completedAtClause WHERE Id = ?";
    $params = array($status, $taskId);
    
    $stmt = sqlsrv_query($conn, $sql, $params);
    
    if($stmt) {
        // Check if this task is a sub-task of a ParentTask
        include_once '../notifications/helper.php';
        $ptSql = "SELECT CAST(t.ParentTaskId AS NVARCHAR(36)) as ParentTaskId, t.Title as SubTaskTitle,
                         pt.Title as ParentTitle, pt.CreatedByUserId as ParentCreatorId
                  FROM Tasks t
                  LEFT JOIN Tasks pt ON t.ParentTaskId = pt.Id
                  WHERE t.Id = ?";
        $ptStmt = sqlsrv_query($conn, $ptSql, array($taskId));
        if ($ptStmt && $ptRow = sqlsrv_fetch_array($ptStmt, SQLSRV_FETCH_ASSOC)) {
            if ($ptRow['ParentTaskId']) {
                $parentTaskId = $ptRow['ParentTaskId'];
                $subTitle = $ptRow['SubTaskTitle'];
                $parentTitle = $ptRow['ParentTitle'];
                $parentCreatorId = $ptRow['ParentCreatorId'];

                // Notify Parent Task Creator
                if ($parentCreatorId) {
                    $notifMsg = "Sub-task \"$subTitle\" under \"$parentTitle\" status changed to $status.";
                    createNotification($conn, $parentCreatorId, "Sub-task Progress Updated", $notifMsg, "Task", $parentTaskId);
                }

                // Also notify Parent Task Assignees
                $paSql = "SELECT UserId FROM TaskAssignments WHERE TaskId = ?";
                $paStmt = sqlsrv_query($conn, $paSql, array($parentTaskId));
                if ($paStmt) {
                    while ($paRow = sqlsrv_fetch_array($paStmt, SQLSRV_FETCH_ASSOC)) {
                        if ($paRow['UserId'] != $parentCreatorId) {
                            $notifMsg = "Sub-task \"$subTitle\" under \"$parentTitle\" status changed to $status.";
                            createNotification($conn, $paRow['UserId'], "Sub-task Progress Updated", $notifMsg, "Task", $parentTaskId);
                        }
                    }
                }
            }
        }

        // Activity log
        include_once '../services/ActivityLogger.php';
        $currentUserId = isset($data->userId) ? $data->userId : null;
        $taskTitle = isset($subTitle) ? $subTitle : "Task #$taskId";
        logUserActivity($conn, $currentUserId, 'Tasks', 'Update Task Status', $taskTitle, $taskId, "Changed task status to '$status'");

        http_response_code(200);
        echo json_encode(array("message" => "Task status updated successfully."));
    } else {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data. taskId and status are required."));
}
?>
