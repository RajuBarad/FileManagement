<?php
include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->fileId) && isset($data->userId)) {
    $fileId = $data->fileId;
    $userId = $data->userId;

    // Check if request already exists
    $checkSql = "SELECT Id FROM UnlockRequests WHERE FileId = ? AND RequesterUserId = ? AND IsFulfilled = 0";
    $checkStmt = sqlsrv_query($conn, $checkSql, array($fileId, $userId));

    if (sqlsrv_has_rows($checkStmt)) {
        echo json_encode(array("message" => "Request already pending."));
        exit;
    }

    $sql = "INSERT INTO UnlockRequests (FileId, RequesterUserId) VALUES (?, ?)";
    $params = array($fileId, $userId);

    $stmt = sqlsrv_query($conn, $sql, $params);

    if($stmt) {
        echo json_encode(array("message" => "Notification request sent."));
    } else {
        http_response_code(500);
        echo json_encode(array("error" => sqlsrv_errors()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
