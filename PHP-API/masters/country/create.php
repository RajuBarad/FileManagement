<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->name)) {
    $sql = "INSERT INTO Countries (Name) OUTPUT INSERTED.Id VALUES (?)";
    $params = array($data->name);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if($stmt) {
        $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
        http_response_code(201);
        echo json_encode(array("message" => "Country was created.", "id" => $row['Id']));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to create country.", "error" => sqlsrv_errors()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to create country. Data is incomplete."));
}
?>
