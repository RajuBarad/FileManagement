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


// 1. Verify ownership or inherited share access of the item to move
$checkSql = "
    WITH Hierarchy AS (
        SELECT Id, ParentId, OwnerId, FileName, IsFolder FROM Files WHERE Id = ? AND IsDeleted = 0
        UNION ALL
        SELECT f.Id, f.ParentId, f.OwnerId, f.FileName, f.IsFolder FROM Files f
        INNER JOIN Hierarchy h ON f.Id = h.ParentId
    )
    SELECT h.Id, h.FileName, h.IsFolder, h.ParentId,
           (SELECT COUNT(*) FROM Hierarchy h2 
            LEFT JOIN GenericShares gs ON h2.Id = gs.FileId
            WHERE h2.OwnerId = ? OR gs.SharedWithUserId = ?) as hasAccess
    FROM Hierarchy h
    WHERE h.Id = ?
";
$checkStmt = sqlsrv_query($conn, $checkSql, array($id, $userId, $userId, $id));

if($checkStmt === false || ($item = sqlsrv_fetch_array($checkStmt, SQLSRV_FETCH_ASSOC)) === null || $item['hasAccess'] == 0) {
    http_response_code(403);
    die(json_encode(array("message" => "Permission denied or file not found.")));
}
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

    // Verify access to Target Folder (Owner or Inherited)
    $targetSql = "
        WITH TargetHierarchy AS (
            SELECT Id, ParentId, OwnerId, IsFolder FROM Files WHERE Id = ? AND IsDeleted = 0
            UNION ALL
            SELECT f.Id, f.ParentId, f.OwnerId, f.IsFolder FROM Files f
            INNER JOIN TargetHierarchy th ON f.Id = th.ParentId
        )
        SELECT th.IsFolder,
               (SELECT COUNT(*) FROM TargetHierarchy th2 
                LEFT JOIN GenericShares gs ON th2.Id = gs.FileId
                WHERE th2.OwnerId = ? OR gs.SharedWithUserId = ?) as hasAccess
        FROM TargetHierarchy th
        WHERE th.Id = ?
    ";
    $targetStmt = sqlsrv_query($conn, $targetSql, array($targetFolderId, $userId, $userId, $targetFolderId));
    if ($targetStmt === false || ($target = sqlsrv_fetch_array($targetStmt, SQLSRV_FETCH_ASSOC)) === null || $target['hasAccess'] == 0) {
        http_response_code(404);
        die(json_encode(array("message" => "Target folder not found or no access.")));
    }
    
    if (!$target['IsFolder']) {
        http_response_code(400);
        die(json_encode(array("message" => "Target is not a folder.")));
    }
}

// 3. Check for name collision in target folder (Regardless of Owner)
$dupSql = "SELECT Id FROM Files WHERE FileName = ? AND " . ($targetFolderId ? "ParentId = ?" : "ParentId IS NULL AND OwnerId = ?") . " AND IsDeleted = 0";
$params = $targetFolderId ? array($itemName, $targetFolderId) : array($itemName, $userId);
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
