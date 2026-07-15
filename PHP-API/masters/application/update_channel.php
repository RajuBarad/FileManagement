<?php
// header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id)) {
    $channelId = isset($data->channelId) && !empty($data->channelId) ? intval($data->channelId) : null;
    
    $sql = "UPDATE Applications SET ChannelId = ? WHERE Id = ?";
    $params = array($channelId, $data->id);
    $stmt = sqlsrv_query($conn, $sql, $params);
    
    if($stmt) {
        http_response_code(200);
        echo json_encode(array("message" => "Task channel was updated."));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to update task channel.", "error" => sqlsrv_errors()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to update task channel. Data is incomplete."));
}
?>
