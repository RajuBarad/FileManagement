<?php


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->id) || !isset($data->ownerId)) {
    http_response_code(400);
    die(json_encode(array("message" => "Missing required fields.")));
}

$id = $data->id;
$ownerId = $data->ownerId;

// Verify ownership
$checkSql = "SELECT Id FROM Files WHERE Id = ? AND OwnerId = ?";
$checkStmt = sqlsrv_query($conn, $checkSql, array($id, $ownerId));

if($checkStmt === false || sqlsrv_has_rows($checkStmt) === false) {
    http_response_code(403);
    die(json_encode(array("message" => "Permission denied or file not found.")));
}

// Transaction for safety
sqlsrv_begin_transaction($conn);

// 1. Delete shares
$deleteSharesSql = "DELETE FROM GenericShares WHERE FileId = ?";
$stmt1 = sqlsrv_query($conn, $deleteSharesSql, array($id));

if($stmt1 === false) {
    sqlsrv_rollback($conn);
    http_response_code(500);
    die(json_encode(array("error" => sqlsrv_errors())));
}

// 2. Soft Delete file/folder
// Mark as deleted instead of removing from DB
$deleteFileSql = "UPDATE Files SET IsDeleted = 1, DeletedAt = GETDATE(), DeletedByUserId = ? WHERE Id = ?";
$stmt2 = sqlsrv_query($conn, $deleteFileSql, array($userId, $id));

if($stmt2 === false) {
    sqlsrv_rollback($conn);
    // Likely constraint violation if folder has children and no cascade
    http_response_code(409); 
    die(json_encode(array("message" => "Could not delete. If this is a folder, ensure it is empty.", "error" => sqlsrv_errors())));
}

sqlsrv_commit($conn);

echo json_encode(array("message" => "Deleted successfully."));
?>
