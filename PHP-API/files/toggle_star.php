<?php
header("Content-Type: application/json; charset=UTF-8");

include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->fileId) && isset($data->userId)) {
    $fileId = $data->fileId;
    $userId = $data->userId;

    // Check if already starred
    $checkSql = "SELECT Id FROM StarredFiles WHERE FileId = ? AND UserId = ?";
    $checkStmt = sqlsrv_query($conn, $checkSql, array($fileId, $userId));

    if($checkStmt && sqlsrv_has_rows($checkStmt)) {
        // Unstar (Delete)
        $deleteSql = "DELETE FROM StarredFiles WHERE FileId = ? AND UserId = ?";
        if(sqlsrv_query($conn, $deleteSql, array($fileId, $userId))) {
            echo json_encode(array("message" => "Unstarred", "isStarred" => false));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Failed to unstar."));
        }
    } else {
        // Star (Insert)
        $insertSql = "INSERT INTO StarredFiles (FileId, UserId) VALUES (?, ?)";
        if(sqlsrv_query($conn, $insertSql, array($fileId, $userId))) {
            echo json_encode(array("message" => "Starred", "isStarred" => true));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Failed to star."));
        }
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
