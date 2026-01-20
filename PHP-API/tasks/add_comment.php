<?php
include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->taskId) && isset($data->userId) && isset($data->content)) {
    $sql = "INSERT INTO TaskComments (TaskId, UserId, Content) VALUES (?, ?, ?)";
    $params = array($data->taskId, $data->userId, $data->content);
    
    $stmt = sqlsrv_query($conn, $sql, $params);
    
    if($stmt === false) {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }
    
    echo json_encode(array("message" => "Comment added successfully"));
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Missing data"));
}
?>
