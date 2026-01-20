<?php
include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->fileId) && isset($data->userId)) {
    $fileId = $data->fileId;
    $userId = $data->userId; // The user to unshare FROM

    // Delete share record
    $sql = "DELETE FROM GenericShares WHERE FileId = ? AND SharedWithUserId = ?";
    $stmt = sqlsrv_query($conn, $sql, array($fileId, $userId));

    if($stmt) {
        // Check if any shares remain for this file
        $checkSql = "SELECT COUNT(*) as ShareCount FROM GenericShares WHERE FileId = ?";
        $checkStmt = sqlsrv_query($conn, $checkSql, array($fileId));
        $count = 0;
        if($checkStmt && $row = sqlsrv_fetch_array($checkStmt)) {
            $count = $row['ShareCount'];
        }

        if($count == 0) {
            // No more shares, update IsShared flag
            $updateSql = "UPDATE Files SET IsShared = 0 WHERE Id = ?";
            sqlsrv_query($conn, $updateSql, array($fileId));
        }

        http_response_code(200);
        echo json_encode(array("message" => "Unshared successfully."));
    } else {
        http_response_code(500);
        echo json_encode(array("error" => sqlsrv_errors()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
