<?php
// PHP-API/permissions/my_permissions.php
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../config/db.php';

$userId = isset($_SERVER['HTTP_X_USER_ID']) ? intval($_SERVER['HTTP_X_USER_ID']) : 0;
if ($userId <= 0 && isset($_GET['userId'])) {
    $userId = intval($_GET['userId']);
}

if ($userId <= 0) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized. User ID not provided."]);
    exit;
}

// Fetch user
$userSql = "SELECT Id, Username, Role FROM Users WHERE Id = ?";
$userStmt = sqlsrv_query($conn, $userSql, [$userId]);
if ($userStmt === false || !($user = sqlsrv_fetch_array($userStmt, SQLSRV_FETCH_ASSOC))) {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "User not found."]);
    exit;
}

$isAdmin = (strtolower($user['Role'] ?? '') === 'admin');

$standardKeys = [
    "files", "tasks", "followups", "history", "users",
    "master_country", "master_state", "master_district", "master_taluka", "master_village",
    "master_channel", "master_followup", "master_scope_of_work", "master_client", "master_application"
];

$permissionsMap = [];

if ($isAdmin) {
    // Admin has full rights on everything
    foreach ($standardKeys as $key) {
        $permissionsMap[$key] = [
            "canView" => true,
            "canAdd" => true,
            "canUpdate" => true,
            "canDelete" => true,
            "view" => true,
            "add" => true,
            "upload" => true,
            "edit" => true,
            "update" => true,
            "delete" => true,
            "share" => true,
            "download" => true,
            "star" => true,
            "move" => true,
            "rename" => true,
            "split" => true,
            "comment" => true,
            "permissions" => true
        ];
    }
} else {
    // Fetch saved permissions
    $permSql = "SELECT ModuleKey, CanView, CanAdd, CanUpdate, CanDelete, Operations FROM UserPermissions WHERE UserId = ?";
    $permStmt = sqlsrv_query($conn, $permSql, [$userId]);

    $hasCustom = false;
    if ($permStmt !== false) {
        while ($row = sqlsrv_fetch_array($permStmt, SQLSRV_FETCH_ASSOC)) {
            $hasCustom = true;
            $modKey = $row['ModuleKey'];
            $canV = (bool)$row['CanView'];
            $canA = (bool)$row['CanAdd'];
            $canU = (bool)$row['CanUpdate'];
            $canD = (bool)$row['CanDelete'];

            $modMap = [
                "canView" => $canV,
                "canAdd" => $canA,
                "canUpdate" => $canU,
                "canDelete" => $canD,
                "view" => $canV,
                "add" => $canA,
                "edit" => $canU,
                "delete" => $canD
            ];

            if (!empty($row['Operations']) && $row['Operations'] !== '{}') {
                $decoded = json_decode($row['Operations'], true);
                if (is_array($decoded)) {
                    foreach ($decoded as $k => $v) {
                        $modMap[$k] = (bool)$v;
                    }
                }
            }

            $permissionsMap[$modKey] = $modMap;
        }
    }

    // Fill missing with defaults
    foreach ($standardKeys as $key) {
        if (!isset($permissionsMap[$key])) {
            $defaultVal = (!$hasCustom && in_array($key, ["files", "tasks", "followups"]));
            $permissionsMap[$key] = [
                "canView" => $defaultVal,
                "canAdd" => $defaultVal,
                "canUpdate" => $defaultVal,
                "canDelete" => $defaultVal,
                "view" => $defaultVal,
                "add" => $defaultVal,
                "upload" => $defaultVal,
                "edit" => $defaultVal,
                "delete" => $defaultVal,
                "share" => $defaultVal,
                "download" => $defaultVal,
                "star" => $defaultVal,
                "move" => $defaultVal,
                "rename" => $defaultVal,
                "split" => $defaultVal,
                "comment" => $defaultVal,
                "permissions" => false
            ];
        }
    }
}

echo json_encode([
    "status" => "success",
    "userId" => $userId,
    "isAdmin" => $isAdmin,
    "permissions" => $permissionsMap
]);
?>
