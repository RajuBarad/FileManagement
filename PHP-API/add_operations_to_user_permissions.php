<?php
// PHP-API/add_operations_to_user_permissions.php
include_once 'config/db.php';

header("Content-Type: application/json; charset=UTF-8");

// 1. Add Operations column if it does not exist
$alterSql = "IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[UserPermissions]') 
    AND name = 'Operations'
)
BEGIN
    ALTER TABLE UserPermissions ADD Operations NVARCHAR(MAX) NULL DEFAULT '{}';
END";

$alterStmt = sqlsrv_query($conn, $alterSql);
if ($alterStmt === false) {
    http_response_code(500);
    echo json_encode(["status" => "error", "error" => sqlsrv_errors()]);
    exit;
}

// 2. Backfill existing records that don't have Operations populated
$selectSql = "SELECT Id, ModuleKey, CanView, CanAdd, CanUpdate, CanDelete, Operations FROM UserPermissions";
$selectStmt = sqlsrv_query($conn, $selectSql);

if ($selectStmt !== false) {
    while ($row = sqlsrv_fetch_array($selectStmt, SQLSRV_FETCH_ASSOC)) {
        $existingOps = $row['Operations'];
        if (empty($existingOps) || $existingOps === '{}') {
            $id = $row['Id'];
            $modKey = $row['ModuleKey'];
            $v = (bool)$row['CanView'];
            $a = (bool)$row['CanAdd'];
            $u = (bool)$row['CanUpdate'];
            $d = (bool)$row['CanDelete'];

            $ops = [];
            if ($modKey === 'files') {
                $ops = [
                    'view' => $v,
                    'upload' => $a,
                    'share' => $v,
                    'download' => $v,
                    'star' => $v,
                    'move' => $u,
                    'rename' => $u,
                    'delete' => $d
                ];
            } else if ($modKey === 'tasks') {
                $ops = [
                    'view' => $v,
                    'add' => $a,
                    'edit' => $u,
                    'delete' => $d,
                    'split' => $a,
                    'comment' => $v,
                    'move' => $u
                ];
            } else if ($modKey === 'users') {
                $ops = [
                    'view' => $v,
                    'add' => $a,
                    'edit' => $u,
                    'delete' => $d,
                    'permissions' => $u
                ];
            } else {
                $ops = [
                    'view' => $v,
                    'add' => $a,
                    'edit' => $u,
                    'delete' => $d
                ];
            }

            $jsonOps = json_encode($ops);
            $updateSql = "UPDATE UserPermissions SET Operations = ? WHERE Id = ?";
            sqlsrv_query($conn, $updateSql, [$jsonOps, $id]);
        }
    }
}

echo json_encode([
    "status" => "success",
    "message" => "Operations column added and populated in UserPermissions table."
]);
?>
