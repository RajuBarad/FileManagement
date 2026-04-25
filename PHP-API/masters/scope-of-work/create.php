<?php
header("Content-Type: application/json; charset=UTF-8");
//header("Access-Control-Allow-Methods: POST");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->name)) {
    $sql = "INSERT INTO ScopesOfWork (Name) VALUES (?)";
    $params = array($data->name);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if($stmt === false) {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to create scope of work.", "error" => sqlsrv_errors()));
    } else {
        http_response_code(201);
        echo json_encode(array("message" => "Scope of work was created."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data. Name is required."));
}
?>
