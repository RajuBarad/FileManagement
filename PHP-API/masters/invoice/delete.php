<?php
// PHP-API/masters/invoice/delete.php
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    $sql = "DELETE FROM Invoices WHERE Id = ?";
    $stmt = sqlsrv_query($conn, $sql, array($data->id));

    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to delete invoice.", "error" => sqlsrv_errors()));
    } else {
        echo json_encode(array("message" => "Invoice was deleted successfully."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data. ID is required."));
}
?>
