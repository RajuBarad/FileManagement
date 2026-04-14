<?php
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id) && !empty($data->name)) {
    $sql = "UPDATE Clients SET Name = ?, MobileNo = ?, Email = ?, Address = ?, VillageId = ? WHERE Id = ?";
    $params = array(
        $data->name,
        isset($data->mobileNo) ? $data->mobileNo : null,
        isset($data->email) ? $data->email : null,
        isset($data->address) ? $data->address : null,
        isset($data->villageId) && $data->villageId > 0 ? $data->villageId : null,
        $data->id
    );
    $stmt = sqlsrv_query($conn, $sql, $params);

    if($stmt === false) {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to update client.", "error" => sqlsrv_errors()));
    } else {
        echo json_encode(array("message" => "Client was updated."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data. ID and Name are required."));
}
?>
