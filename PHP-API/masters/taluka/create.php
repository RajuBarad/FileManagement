<?php
// header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
// header("Access-Control-Allow-Methods: DELETE");
// header("Access-Control-Max-Age: 3600");
// header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->name) && !empty($data->districtId)) {
    $sql = "INSERT INTO Talukas (Name, DistrictId) OUTPUT INSERTED.Id VALUES (?, ?)";
    $params = array($data->name, $data->districtId);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if($stmt) {
        $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
        http_response_code(201);
        echo json_encode(array("message" => "Taluka was created.", "id" => $row['Id']));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to create taluka.", "error" => sqlsrv_errors()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to create taluka. Data is incomplete."));
}
?>
