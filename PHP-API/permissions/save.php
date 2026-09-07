<?php
// PHP-API/permissions/save.php
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed. Use POST."]);
    exit;
}

include_once '../config/db.php';
include_once '../services/ActivityLogger.php';

// Auth check: Requester must be Admin
$requestUserId = isset($_SERVER['HTTP_X_USER_ID']) ? $_SERVER['HTTP_X_USER_ID'] : null;
if ($requestUserId) {
    $authSql = "SELECT Username, Role FROM Users WHERE Id = ?";
    $authStmt = sqlsrv_query($conn, $authSql, [$requestUserId]);
    if ($authStmt && $authUser = sqlsrv_fetch_array($authStmt, SQLSRV_FETCH_ASSOC)) {
        if (strtolower($authUser['Role'] ?? '') !== 'admin') {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Access denied. Only administrators can configure user rights."]);
            exit;
        }
    }
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data || !isset($data['userId']) || !isset($data['permissions']) || !is_array($data['permissions'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid payload. 'userId' and 'permissions' array are required."]);
    exit;
}

$targetUserId = intval($data['userId']);
if ($targetUserId <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid target userId."]);
    exit;
}

// Verify target user exists
$userSql = "SELECT Id, Username, Role FROM Users WHERE Id = ?";
$userStmt = sqlsrv_query($conn, $userSql, [$targetUserId]);
if ($userStmt === false || !($targetUser = sqlsrv_fetch_array($userStmt, SQLSRV_FETCH_ASSOC))) {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "Target user not found."]);
    exit;
}

// Begin transaction
sqlsrv_begin_transaction($conn);

try {
    // Delete existing permissions for target user
    $deleteSql = "DELETE FROM UserPermissions WHERE UserId = ?";
    $deleteStmt = sqlsrv_query($conn, $deleteSql, [$targetUserId]);
    if ($deleteStmt === false) {
        throw new Exception("Failed to clear existing permissions: " . json_encode(sqlsrv_errors()));
    }

    $insertSql = "INSERT INTO UserPermissions (UserId, ModuleKey, CanView, CanAdd, CanUpdate, CanDelete, Operations, UpdatedAt) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, GETDATE())";

    $count = 0;
    foreach ($data['permissions'] as $p) {
        $moduleKey = trim($p['moduleKey'] ?? '');
        if ($moduleKey === '') continue;

        $ops = [];
        if (isset($p['operations']) && is_array($p['operations'])) {
            $ops = $p['operations'];
            // Normalize boolean values
            foreach ($ops as $k => $v) {
                $ops[$k] = !empty($v);
            }
            $canView = !empty($ops['view']) ? 1 : 0;
            $canAdd = (!empty($ops['add']) || !empty($ops['upload'])) ? 1 : 0;
            $canUpdate = (!empty($ops['edit']) || !empty($ops['update']) || !empty($ops['rename']) || !empty($ops['move'])) ? 1 : 0;
            $canDelete = !empty($ops['delete']) ? 1 : 0;
        } else {
            $canView = !empty($p['canView']) ? 1 : 0;
            $canAdd = !empty($p['canAdd']) ? 1 : 0;
            $canUpdate = !empty($p['canUpdate']) ? 1 : 0;
            $canDelete = !empty($p['canDelete']) ? 1 : 0;
            $ops = [
                'view' => (bool)$canView,
                'add' => (bool)$canAdd,
                'edit' => (bool)$canUpdate,
                'delete' => (bool)$canDelete
            ];
        }

        $opsJson = json_encode($ops);

        $params = [$targetUserId, $moduleKey, $canView, $canAdd, $canUpdate, $canDelete, $opsJson];
        $insertStmt = sqlsrv_query($conn, $insertSql, $params);
        if ($insertStmt === false) {
            throw new Exception("Failed to insert permission for module $moduleKey: " . json_encode(sqlsrv_errors()));
        }
        $count++;
    }

    sqlsrv_commit($conn);

    // Log Activity
    ActivityLogger::logUserActivity(
        $conn,
        "Users",
        "Update Permissions",
        "Permissions updated for user: " . $targetUser['Username'] . " ($count modules configured with granular operations)",
        "User",
        (string)$targetUserId
    );

    echo json_encode([
        "status" => "success",
        "message" => "Permissions saved successfully ($count modules updated).",
        "userId" => $targetUserId,
        "modulesUpdated" => $count
    ]);
} catch (Exception $e) {
    sqlsrv_rollback($conn);
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
