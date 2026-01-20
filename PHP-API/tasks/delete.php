<?php
include_once '../config/db.php';

if(isset($_GET['id'])) {
    $id = $_GET['id'];
    
    $sql = "DELETE FROM Tasks WHERE Id = ?";
    $params = array($id);
    
    $stmt = sqlsrv_query($conn, $sql, $params);
    
    if($stmt) {
        http_response_code(200);
        echo json_encode(array("message" => "Task deleted successfully."));
    } else {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Missing id."));
}
?>
