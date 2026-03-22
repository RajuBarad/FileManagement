<?php

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->id) || !isset($data->userId)) {
    http_response_code(400);
    die(json_encode(array("message" => "Missing required fields (id, userId).")));
}

$id = $data->id;
$userId = $data->userId;
$targetFolderId = isset($data->targetFolderId) ? $data->targetFolderId : null;

file_put_contents("../php_move_debug.log", date('Y-m-d H:i:s') . " - Move. ID: $id, User: $userId, Target: " . ($targetFolderId ?? 'NULL') . "\n", FILE_APPEND);


// 1. Verify ownership or share access of the item to move
$checkSql = "SELECT f.Id, f.FileName, f.IsFolder, f.ParentId FROM Files f 
             LEFT JOIN GenericShares gs ON f.Id = gs.FileId
             WHERE f.Id = ? AND (f.OwnerId = ? OR gs.SharedWithUserId = ?) AND f.IsDeleted = 0";
$checkStmt = sqlsrv_query($conn, $checkSql, array($id, $userId, $userId));

if($checkStmt === false || sqlsrv_has_rows($checkStmt) === false) {
    http_response_code(403);
    die(json_encode(array("message" => "Permission denied or file not found.")));
}

$item = sqlsrv_fetch_array($checkStmt, SQLSRV_FETCH_ASSOC);
$itemName = $item['FileName'];
$isFolder = $item['IsFolder'];
$currentParentId = $item['ParentId'];

// Prevent moving to the same parent
if ($currentParentId === $targetFolderId) {
    http_response_code(400);
    die(json_encode(array("message" => "Item is already in this folder.")));
}

// 2. If targetFolderId is provided, verify it exists and is a folder
if ($targetFolderId !== null) {
    // Prevent moving a folder inside itself or its descendants
    if ($isFolder) {
        if ($id === $targetFolderId) {
            http_response_code(400);
            die(json_encode(array("message" => "Cannot move a folder into itself.")));
        }
        
        // Check if targetFolderId is a descendant of $id
        $currentIdToCheck = $targetFolderId;
        while ($currentIdToCheck !== null) {
            $ancestorSql = "SELECT ParentId FROM Files WHERE Id = ?";
            $ancestorStmt = sqlsrv_query($conn, $ancestorSql, array($currentIdToCheck));
            if ($ancestorStmt && $ancestorRow = sqlsrv_fetch_array($ancestorStmt, SQLSRV_FETCH_ASSOC)) {
                $parentIdOfCheck = $ancestorRow['ParentId'];
                if ($parentIdOfCheck === $id) {
                    http_response_code(400);
                    die(json_encode(array("message" => "Cannot move a folder into its own subfolder.")));
                }
                $currentIdToCheck = $parentIdOfCheck;
            } else {
                break;
            }
        }
    }

    $targetSql = "SELECT Id, IsFolder FROM Files WHERE Id = ? AND IsDeleted = 0";
    $targetStmt = sqlsrv_query($conn, $targetSql, array($targetFolderId));
    if ($targetStmt === false || sqlsrv_has_rows($targetStmt) === false) {
        http_response_code(404);
        die(json_encode(array("message" => "Target folder not found.")));
    }
    
    $target = sqlsrv_fetch_array($targetStmt, SQLSRV_FETCH_ASSOC);
    if (!$target['IsFolder']) {
        http_response_code(400);
        die(json_encode(array("message" => "Target is not a folder.")));
    }
}

// 3. Check for name collision in target folder
$dupSql = "SELECT Id FROM Files WHERE FileName = ? AND OwnerId = ? " . ($targetFolderId ? "AND ParentId = ?" : "AND ParentId IS NULL") . " AND IsDeleted = 0";
$params = $targetFolderId ? array($itemName, $userId, $targetFolderId) : array($itemName, $userId);
$dupStmt = sqlsrv_query($conn, $dupSql, $params);

if($dupStmt !== false && sqlsrv_has_rows($dupStmt) === true) {
    http_response_code(409);
    die(json_encode(array("message" => "An item with this name already exists in the destination.")));
}

// 4. Update ParentId
$sql = "UPDATE Files SET ParentId = ? WHERE Id = ?";
$stmt = sqlsrv_query($conn, $sql, array($targetFolderId, $id));

if($stmt === false) {
    http_response_code(500);
    die(json_encode(array("error" => sqlsrv_errors())));
}

echo json_encode(array(
    "id" => $id,
    "parentId" => $targetFolderId,
    "message" => "Moved successfully."
));
?>
