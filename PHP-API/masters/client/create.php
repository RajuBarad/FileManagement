<?php
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->name)) {
    $sql = "INSERT INTO Clients (Name, MobileNo, Email, Address, VillageId) VALUES (?, ?, ?, ?, ?)";
    $params = array(
        $data->name,
        isset($data->mobileNo) ? $data->mobileNo : null,
        isset($data->email) ? $data->email : null,
        isset($data->address) ? $data->address : null,
        isset($data->villageId) && $data->villageId > 0 ? $data->villageId : null
    );
    $stmt = sqlsrv_query($conn, $sql, $params);

    if($stmt === false) {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to create client.", "error" => sqlsrv_errors()));
    } else {
        http_response_code(201);
        echo json_encode(array("message" => "Client was created."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data. Name is required."));
}
?>
