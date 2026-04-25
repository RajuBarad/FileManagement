<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id) && !empty($data->name)) {
    $sql = "UPDATE Countries SET Name = ? WHERE Id = ?";
    $params = array($data->name, $data->id);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if($stmt) {
        http_response_code(200);
        echo json_encode(array("message" => "Country was updated."));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to update country.", "error" => sqlsrv_errors()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to update country. Data is incomplete."));
}
?>
