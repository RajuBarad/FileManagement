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

// Verify access (Owner or Inherited)
$checkSql = "
    WITH Hierarchy AS (
        SELECT Id, ParentId, OwnerId FROM Files WHERE Id = ? AND IsDeleted = 0
        UNION ALL
        SELECT f.Id, f.ParentId, f.OwnerId FROM Files f
        INNER JOIN Hierarchy h ON f.Id = h.ParentId
    )
    SELECT (SELECT COUNT(*) FROM Hierarchy h2 
            LEFT JOIN GenericShares gs ON h2.Id = gs.FileId
            WHERE h2.OwnerId = ? OR gs.SharedWithUserId = ?) as hasAccess
";
$checkStmt = sqlsrv_query($conn, $checkSql, array($id, $ownerId, $ownerId));

if($checkStmt === false || ($accessRow = sqlsrv_fetch_array($checkStmt, SQLSRV_FETCH_ASSOC)) === null || $accessRow['hasAccess'] == 0) {
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

// 2. Recursive Soft Delete file/folder and all its contents
$deleteFileSql = "
    WITH Descendants AS (
        SELECT Id FROM Files WHERE Id = ?
        UNION ALL
        SELECT f.Id FROM Files f
        INNER JOIN Descendants d ON f.ParentId = d.Id
    )
    UPDATE Files 
    SET IsDeleted = 1, 
        DeletedAt = GETDATE(), 
        DeletedByUserId = ? 
    WHERE Id IN (SELECT Id FROM Descendants)
";
$stmt2 = sqlsrv_query($conn, $deleteFileSql, array($id, $ownerId));

if($stmt2 === false) {
    sqlsrv_rollback($conn);
    http_response_code(500); 
    die(json_encode(array("message" => "Could not delete items.", "error" => sqlsrv_errors())));
}

sqlsrv_commit($conn);

echo json_encode(array("message" => "Deleted successfully."));
?>
