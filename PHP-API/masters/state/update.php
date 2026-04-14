<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id) && !empty($data->name) && !empty($data->countryId)) {
    $sql = "UPDATE States SET Name = ?, CountryId = ? WHERE Id = ?";
    $params = array($data->name, $data->countryId, $data->id);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if($stmt) {
        http_response_code(200);
        echo json_encode(array("message" => "State was updated."));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to update state.", "error" => sqlsrv_errors()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to update state. Data is incomplete."));
}
?>
