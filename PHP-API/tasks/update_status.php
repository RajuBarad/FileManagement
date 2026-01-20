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
