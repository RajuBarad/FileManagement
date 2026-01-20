<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->fileId) && isset($data->userId)) {
    $fileId = $data->fileId;
    $userId = $data->userId;

    // Restore: Set IsDeleted = 0
    $sql = "UPDATE Files SET IsDeleted = 0, DeletedAt = NULL, DeletedByUserId = NULL WHERE Id = ? AND OwnerId = ?";
    $params = array($fileId, $userId);

    if(sqlsrv_query($conn, $sql, $params)) {
        echo json_encode(array("message" => "File restored."));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Failed to restore file."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
