<?php
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id)) {
    $followupId = isset($data->followupId) && !empty($data->followupId) ? intval($data->followupId) : null;
    
    $sql = "UPDATE Applications SET FollowupId = ? WHERE Id = ?";
    $params = array($followupId, $data->id);
    $stmt = sqlsrv_query($conn, $sql, $params);
    
    if($stmt) {
        http_response_code(200);
        echo json_encode(array("message" => "Task followup was updated."));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to update task followup.", "error" => sqlsrv_errors()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to update task followup. Data is incomplete."));
}
?>
