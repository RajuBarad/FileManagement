<?php
// PHP-API/services/ActivityLogger.php

function logUserActivity($conn, $userId, $module, $action, $entityName = null, $entityId = null, $details = null, $userName = null, $userRole = null) {
    if (!$conn) return false;

    // Resolve user details if not provided
    if ($userId && (!$userName || !$userRole)) {
        $uSql = "SELECT Username, Role FROM Users WHERE Id = ?";
        $uStmt = sqlsrv_query($conn, $uSql, array($userId));
        if ($uStmt && $uRow = sqlsrv_fetch_array($uStmt, SQLSRV_FETCH_ASSOC)) {
            if (!$userName) $userName = $uRow['Username'];
            if (!$userRole) $userRole = $uRow['Role'];
        }
    }

    $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '127.0.0.1';

    $sql = "INSERT INTO UserActivityLogs (UserId, UserName, UserRole, Module, Action, EntityName, EntityId, Details, IpAddress, CreatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE())";
    $params = array(
        $userId ? intval($userId) : null,
        $userName,
        $userRole,
        $module,
        $action,
        $entityName,
        $entityId ? (string)$entityId : null,
        $details,
        $ip
    );

    $stmt = sqlsrv_query($conn, $sql, $params);
    return $stmt !== false;
}

class ActivityLogger {
    public static function logUserActivity($conn, $module, $action, $details = null, $entityName = null, $entityId = null, $userId = null) {
        if (!$userId) {
            $userId = isset($_SERVER['HTTP_X_USER_ID']) ? $_SERVER['HTTP_X_USER_ID'] : null;
        }
        return logUserActivity($conn, $userId, $module, $action, $entityName, $entityId, $details);
    }
}
?>
