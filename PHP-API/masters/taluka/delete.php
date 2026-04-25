<?php
// header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
// header("Access-Control-Allow-Methods: DELETE");
// header("Access-Control-Max-Age: 3600");
// header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id)) {
    // Check if any villages are linked to this taluka
    $checkSql = "SELECT COUNT(*) as count FROM Villages WHERE TalukaId = ?";
    $checkStmt = sqlsrv_query($conn, $checkSql, array($data->id));
    $row = sqlsrv_fetch_array($checkStmt, SQLSRV_FETCH_ASSOC);

    if($row['count'] > 0) {
        http_response_code(400);
        echo json_encode(array("message" => "Unable to delete taluka. It has linked villages."));
    } else {
        $sql = "DELETE FROM Talukas WHERE Id = ?";
        $params = array($data->id);
        $stmt = sqlsrv_query($conn, $sql, $params);

        if($stmt) {
            http_response_code(200);
            echo json_encode(array("message" => "Taluka was deleted."));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Unable to delete taluka.", "error" => sqlsrv_errors()));
        }
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to delete taluka. Data is incomplete."));
}
?>
