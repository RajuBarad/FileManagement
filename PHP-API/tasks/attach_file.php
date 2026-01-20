<?php
include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->taskId) && isset($data->fileId)) {
    $taskId = $data->taskId;
    $fileId = $data->fileId;
    
    // Check if already attached
    $checkSql = "SELECT Id FROM TaskAttachments WHERE TaskId = ? AND FileId = ?";
    $checkStmt = sqlsrv_query($conn, $checkSql, array($taskId, $fileId));
    if(sqlsrv_has_rows($checkStmt)) {
        http_response_code(409); // Conflict
        echo json_encode(array("message" => "File already attached."));
        exit;
    }

    $sql = "INSERT INTO TaskAttachments (TaskId, FileId) VALUES (?, ?)";
    $params = array($taskId, $fileId);
    
    $stmt = sqlsrv_query($conn, $sql, $params);
    
    if($stmt) {
        http_response_code(201);
        echo json_encode(array("message" => "File attached successfully."));
    } else {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
