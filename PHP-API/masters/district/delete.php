<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: DELETE");
include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id)) {
    // Check if any talukas are linked to this district
    $checkSql = "SELECT COUNT(*) as count FROM Talukas WHERE DistrictId = ?";
    $checkStmt = sqlsrv_query($conn, $checkSql, array($data->id));
    $row = sqlsrv_fetch_array($checkStmt, SQLSRV_FETCH_ASSOC);

    if($row['count'] > 0) {
        http_response_code(400);
        echo json_encode(array("message" => "Unable to delete district. It has linked talukas."));
    } else {
        $sql = "DELETE FROM Districts WHERE Id = ?";
        $params = array($data->id);
        $stmt = sqlsrv_query($conn, $sql, $params);

        if($stmt) {
            http_response_code(200);
            echo json_encode(array("message" => "District was deleted."));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Unable to delete district.", "error" => sqlsrv_errors()));
        }
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to delete district. Data is incomplete."));
}
?>
