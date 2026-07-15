<?php
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id)) {
    $sql = "UPDATE Applications SET IsClosed = 0 WHERE Id = ?";
    $params = array($data->id);
    $stmt = sqlsrv_query($conn, $sql, $params);
    
    if($stmt) {
        http_response_code(200);
        echo json_encode(array("message" => "Task was successfully reopened and set to active."));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to reopen task.", "error" => sqlsrv_errors()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to reopen task. Data is incomplete."));
}
?>
