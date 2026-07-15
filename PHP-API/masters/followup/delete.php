<?php
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id)) {
    $sql = "DELETE FROM Followups WHERE Id = ?";
    $params = array($data->id);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if($stmt) {
        http_response_code(200);
        echo json_encode(array("message" => "Followup status was deleted."));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to delete followup status.", "error" => sqlsrv_errors()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to delete followup status. Data is incomplete."));
}
?>
