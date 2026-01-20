<?php

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->id) || !isset($data->ownerId) || !isset($data->name)) {
    http_response_code(400);
    die(json_encode(array("message" => "Missing required fields.")));
}

$id = $data->id;
$ownerId = $data->ownerId;
$newName = $data->name;

// Verify ownership
$checkSql = "SELECT Id FROM Files WHERE Id = ? AND OwnerId = ?";
$checkStmt = sqlsrv_query($conn, $checkSql, array($id, $ownerId));

if($checkStmt === false || sqlsrv_has_rows($checkStmt) === false) {
    http_response_code(403);
    die(json_encode(array("message" => "Permission denied or file not found.")));
}

// Check if name already exists in the same folder (optional but recommended)
// We need to get the ParentId of the current file first to check siblings
$parentSql = "SELECT ParentId, IsFolder, CreatedAt, UploadDate, OwnerId, IsShared FROM Files WHERE Id = ?";
$parentStmt = sqlsrv_query($conn, $parentSql, array($id));
$currentFile = sqlsrv_fetch_array($parentStmt, SQLSRV_FETCH_ASSOC);
$parentId = $currentFile['ParentId'];

// Check for duplicate name
$dupSql = "SELECT Id FROM Files WHERE FileName = ? AND OwnerId = ? " . ($parentId ? "AND ParentId = ?" : "AND ParentId IS NULL") . " AND Id != ?";
$params = $parentId ? array($newName, $ownerId, $parentId, $id) : array($newName, $ownerId, $id);
$dupStmt = sqlsrv_query($conn, $dupSql, $params);

if($dupStmt !== false && sqlsrv_has_rows($dupStmt) === true) {
    http_response_code(409);
    die(json_encode(array("message" => "A file or folder with this name already exists.")));
}

$sql = "UPDATE Files SET FileName = ? WHERE Id = ?";
$stmt = sqlsrv_query($conn, $sql, array($newName, $id));

if($stmt === false) {
    http_response_code(500);
    die(json_encode(array("error" => sqlsrv_errors())));
}

// Return updated object - mimicking filesystem item
echo json_encode(array(
    "id" => $id,
    "name" => $newName,
    "parentId" => $parentId,
    "ownerId" => $ownerId,
    // Add other fields if strictly needed by frontend, but usually it updates locally
    "message" => "Renamed successfully."
));
?>
