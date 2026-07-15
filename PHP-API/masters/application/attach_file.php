<?php
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->applicationId) && isset($data->fileId)) {
    $applicationId = $data->applicationId;
    $fileId = $data->fileId;
    
    // Check if already attached
    $checkSql = "SELECT Id FROM ApplicationAttachments WHERE ApplicationId = ? AND FileId = ?";
    $checkStmt = sqlsrv_query($conn, $checkSql, array($applicationId, $fileId));
    
    if($checkStmt !== false && sqlsrv_has_rows($checkStmt)) {
        http_response_code(409); // Conflict
        echo json_encode(array("message" => "File already attached."));
        exit;
    }

    $sql = "INSERT INTO ApplicationAttachments (ApplicationId, FileId) VALUES (?, ?)";
    $params = array($applicationId, $fileId);
    
    $stmt = sqlsrv_query($conn, $sql, $params);
    
    if($stmt) {
        http_response_code(201);
        echo json_encode(array("message" => "File attached successfully."));
    } else {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
