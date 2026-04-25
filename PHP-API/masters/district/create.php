<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->name) && !empty($data->stateId)) {
    $sql = "INSERT INTO Districts (Name, StateId) OUTPUT INSERTED.Id VALUES (?, ?)";
    $params = array($data->name, $data->stateId);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if($stmt) {
        $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
        http_response_code(201);
        echo json_encode(array("message" => "District was created.", "id" => $row['Id']));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to create district.", "error" => sqlsrv_errors()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to create district. Data is incomplete."));
}
?>
