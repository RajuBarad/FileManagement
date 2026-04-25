<?php
// header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
// header("Access-Control-Allow-Methods: PUT");
// header("Access-Control-Max-Age: 3600");
// header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id) && !empty($data->name) && !empty($data->districtId)) {
    $sql = "UPDATE Talukas SET Name = ?, DistrictId = ? WHERE Id = ?";
    $params = array($data->name, $data->districtId, $data->id);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if($stmt) {
        http_response_code(200);
        echo json_encode(array("message" => "Taluka was updated."));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to update taluka.", "error" => sqlsrv_errors()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to update taluka. Data is incomplete."));
}
?>
