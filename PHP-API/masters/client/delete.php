<?php
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id)) {
    $sql = "DELETE FROM Clients WHERE Id = ?";
    $params = array($data->id);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if($stmt === false) {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to delete client.", "error" => sqlsrv_errors()));
    } else {
        echo json_encode(array("message" => "Client was deleted."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data. ID is required."));
}
?>
