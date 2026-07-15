<?php
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->ids) && is_array($data->ids)) {
    if(sqlsrv_begin_transaction($conn) === false) {
        http_response_code(500);
        die(json_encode(array("message" => "Unable to start transaction.", "error" => sqlsrv_errors())));
    }
    
    $success = true;
    foreach($data->ids as $index => $id) {
        $sequence = $index + 1;
        $sql = "UPDATE Followups SET Sequence = ? WHERE Id = ?";
        $params = array($sequence, $id);
        $stmt = sqlsrv_query($conn, $sql, $params);
        if($stmt === false) {
            $success = false;
            break;
        }
    }
    
    if($success) {
        sqlsrv_commit($conn);
        http_response_code(200);
        echo json_encode(array("message" => "Sequences updated successfully."));
    } else {
        sqlsrv_rollback($conn);
        http_response_code(500);
        echo json_encode(array("message" => "Unable to update sequences.", "error" => sqlsrv_errors()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to update sequences. Data is incomplete."));
}
?>
