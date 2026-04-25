<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id) && !empty($data->name)) {
    $sql = "UPDATE ScopesOfWork SET Name = ? WHERE Id = ?";
    $params = array($data->name, $data->id);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if($stmt === false) {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to update scope of work.", "error" => sqlsrv_errors()));
    } else {
        echo json_encode(array("message" => "Scope of work was updated."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data. ID and Name are required."));
}
?>
