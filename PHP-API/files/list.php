<?php
include_once '../config/db.php';

if(isset($_GET['userId'])) {
    $userId = $_GET['userId'];
    $parentId = isset($_GET['parentId']) && $_GET['parentId'] !== 'null' ? $_GET['parentId'] : null;
    
    file_put_contents("../php_list_debug.log", date('Y-m-d H:i:s') . " - List Request. User: $userId, Parent: " . ($parentId ?? 'NULL') . "\n", FILE_APPEND);
    
    // Get owned files AND shared files
    // Filter by ParentId
    
    // Logic:
    // 1. If ParentId is NULL (Root):
    //    Show files I own at Root OR files explicitly shared with me (that act as roots for me).
    // 2. If ParentId is SET (Browsing a Folder):
    //    First, check if I have access to this Folder (Owner OR SharedWith).
    //    If yes, show ALL files in this folder (regardless of who owns them).
    
    if ($parentId === null) {
        $filter = isset($_GET['filter']) ? $_GET['filter'] : null;

        if ($filter === 'starred') {
            // Show ONLY starred files for this user (and not deleted)
            $sql = "SELECT DISTINCT CAST(f.Id AS NVARCHAR(36)) as Id, f.FileName, f.FilePath, f.FileSize, f.OwnerId, CAST(f.ParentId AS NVARCHAR(36)) as ParentId, f.IsFolder, u.Username as OwnerName, 
                           CASE WHEN f.OwnerId = ? THEN 'Owned' ELSE 'Shared' END as AccessType,
                           f.IsShared,
                           f.IsLocked, f.LockedByUserId, f.LockedOn, lu.Username as LockedByUserName,
                           CAST(1 AS BIT) as IsStarred, f.IsDeleted, f.DeletedAt, f.LastModified
                    FROM Files f 
                    JOIN Users u ON f.OwnerId = u.Id
                    LEFT JOIN Users lu ON f.LockedByUserId = lu.Id
                    JOIN StarredFiles sf ON f.Id = sf.FileId
                    WHERE sf.UserId = ? AND f.IsDeleted = 0";
            $params = array($userId, $userId);
        } else if ($filter === 'trash') {
            // 1. Cleanup old trash (older than 30 days)
            $cleanupSql = "DELETE FROM Files WHERE IsDeleted = 1 AND DeletedAt < DATEADD(day, -30, GETDATE())";
            sqlsrv_query($conn, $cleanupSql);

            // 2. Show Trash
            $sql = "SELECT CAST(f.Id AS NVARCHAR(36)) as Id, f.FileName, f.FilePath, f.FileSize, f.OwnerId, CAST(f.ParentId AS NVARCHAR(36)) as ParentId, f.IsFolder, u.Username as OwnerName, 
                           CASE WHEN f.OwnerId = ? THEN 'Owned' ELSE 'Shared' END as AccessType,
                           f.IsShared,
                           f.IsLocked, f.LockedByUserId, f.LockedOn, lu.Username as LockedByUserName,
                           CASE WHEN sf.Id IS NOT NULL THEN 1 ELSE 0 END as IsStarred, f.IsDeleted, f.DeletedAt, f.LastModified,
                           dbu.Username as DeletedByName
                    FROM Files f 
                    JOIN Users u ON f.OwnerId = u.Id
                    LEFT JOIN Users lu ON f.LockedByUserId = lu.Id
                    LEFT JOIN Users dbu ON f.DeletedByUserId = dbu.Id
                    LEFT JOIN StarredFiles sf ON f.Id = sf.FileId AND sf.UserId = ?
                    WHERE f.OwnerId = ? AND f.IsDeleted = 1";
            $params = array($userId, $userId, $userId);

        } else if ($filter === 'recent') {
            // Recent files (Owned or Shared, Not Deleted, Sort by LastModified)
            // Limit 20
            $sql = "SELECT TOP 20 CAST(f.Id AS NVARCHAR(36)) as Id, f.FileName, f.FilePath, f.FileSize, f.OwnerId, CAST(f.ParentId AS NVARCHAR(36)) as ParentId, f.IsFolder, u.Username as OwnerName, 
                           CASE WHEN f.OwnerId = ? THEN 'Owned' ELSE 'Shared' END as AccessType,
                           f.IsShared,
                           f.IsLocked, f.LockedByUserId, f.LockedOn, lu.Username as LockedByUserName,
                           CASE WHEN sf.Id IS NOT NULL THEN 1 ELSE 0 END as IsStarred, f.IsDeleted, f.DeletedAt, f.LastModified
                    FROM Files f 
                    JOIN Users u ON f.OwnerId = u.Id
                    LEFT JOIN Users lu ON f.LockedByUserId = lu.Id
                    LEFT JOIN StarredFiles sf ON f.Id = sf.FileId AND sf.UserId = ?
                    WHERE (f.OwnerId = ? OR f.Id IN (SELECT FileId FROM GenericShares WHERE SharedWithUserId = ?)) 
                      AND f.IsDeleted = 0
                    ORDER BY f.LastModified DESC";
            $params = array($userId, $userId, $userId, $userId);

        } else if ($filter === 'shared') {
            // Shared View (Incoming + Outgoing)
            $sql = "SELECT DISTINCT CAST(f.Id AS NVARCHAR(36)) as Id, f.FileName, f.FilePath, f.FileSize, f.OwnerId, CAST(f.ParentId AS NVARCHAR(36)) as ParentId, f.IsFolder, u.Username as OwnerName, 
                           CASE WHEN f.OwnerId = ? THEN 'Owned' ELSE 'Shared' END as AccessType,
                           f.IsShared,
                           f.IsLocked, f.LockedByUserId, f.LockedOn, lu.Username as LockedByUserName,
                           CASE WHEN sf.Id IS NOT NULL THEN 1 ELSE 0 END as IsStarred, f.IsDeleted, f.DeletedAt, f.LastModified
                    FROM Files f 
                    JOIN Users u ON f.OwnerId = u.Id
                    LEFT JOIN Users lu ON f.LockedByUserId = lu.Id
                    LEFT JOIN GenericShares gs ON f.Id = gs.FileId
                    LEFT JOIN StarredFiles sf ON f.Id = sf.FileId AND sf.UserId = ?
                    WHERE (gs.SharedWithUserId = ? OR (f.OwnerId = ? AND f.IsShared = 1)) 
                      AND f.IsDeleted = 0";
            $params = array($userId, $userId, $userId, $userId);
        } else {
            // Normal Root View (Not Deleted)
            $sql = "SELECT CAST(f.Id AS NVARCHAR(36)) as Id, f.FileName, f.FilePath, f.FileSize, f.OwnerId, CAST(f.ParentId AS NVARCHAR(36)) as ParentId, f.IsFolder, u.Username as OwnerName, 'Owned' as AccessType,
                           f.IsShared,
                           f.IsLocked, f.LockedByUserId, f.LockedOn, lu.Username as LockedByUserName,
                           CASE WHEN sf.Id IS NOT NULL THEN 1 ELSE 0 END as IsStarred, f.IsDeleted, f.DeletedAt, f.LastModified
                    FROM Files f 
                    JOIN Users u ON f.OwnerId = u.Id
                    LEFT JOIN Users lu ON f.LockedByUserId = lu.Id
                    LEFT JOIN StarredFiles sf ON f.Id = sf.FileId AND sf.UserId = ?
                    WHERE f.OwnerId = ? AND f.ParentId IS NULL AND f.IsDeleted = 0";
            
            $params = array($userId, $userId);
        }
    } else {
        // Checking Access to the Parent Folder
        $accessSql = "SELECT COUNT(*) as cnt FROM Files f
                      LEFT JOIN GenericShares gs ON f.Id = gs.FileId
                      WHERE f.Id = ? AND (f.OwnerId = ? OR gs.SharedWithUserId = ?)";
        $accessStmt = sqlsrv_query($conn, $accessSql, array($parentId, $userId, $userId));
        $hasAccess = false;
        if ($accessStmt && sqlsrv_fetch_array($accessStmt)['cnt'] > 0) {
            $hasAccess = true;
        }

        if (!$hasAccess) {
             echo json_encode([]); // No access or folder doesn't exist
             exit;
        }

        // Return ALL files in this folder (Not Deleted)
        $sql = "SELECT CAST(f.Id AS NVARCHAR(36)) as Id, f.FileName, f.FilePath, f.FileSize, f.OwnerId, CAST(f.ParentId AS NVARCHAR(36)) as ParentId, f.IsFolder, u.Username as OwnerName, 
                       CASE WHEN f.OwnerId = ? THEN 'Owned' ELSE 'Shared' END as AccessType,
                       f.IsShared,
                       f.IsLocked, f.LockedByUserId, f.LockedOn, lu.Username as LockedByUserName,
                       CASE WHEN sf.Id IS NOT NULL THEN 1 ELSE 0 END as IsStarred, f.IsDeleted, f.DeletedAt, f.LastModified
                FROM Files f
                JOIN Users u ON f.OwnerId = u.Id
                LEFT JOIN Users lu ON f.LockedByUserId = lu.Id
                LEFT JOIN StarredFiles sf ON f.Id = sf.FileId AND sf.UserId = ?
                WHERE f.ParentId = ? AND f.IsDeleted = 0";
        $params = array($userId, $userId, $parentId);
    }

    $stmt = sqlsrv_query($conn, $sql, $params);
    
    if($stmt === false) {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }
    
    $files = array();
    while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        // Map to simpler JSON keys if needed, or keep DB columns
        $files[] = array(
            'id' => $row['Id'], // Cast to string for frontend if needed? PHP does this loosely.
            'name' => $row['FileName'],
            'type' => $row['IsFolder'] ? 'folder' : 'file', // logic to determine extension type done in JS usually or here
            'size' => $row['FileSize'],
            'ownerId' => $row['OwnerId'],
            'ownerName' => $row['OwnerName'],
            'parentId' => $row['ParentId'],
            'accessType' => $row['AccessType'],
            'url' => (isset($_SERVER['HTTPS']) ? "https" : "http") . "://$_SERVER[HTTP_HOST]/files/download.php?id=" . $row['Id'], 
            'isStarred' => isset($row['IsStarred']) ? (bool)$row['IsStarred'] : false,
            'isShared' => isset($row['IsShared']) ? (bool)$row['IsShared'] : false,
            'isLocked' => (bool)$row['IsLocked'],
            'lockedByUserId' => $row['LockedByUserId'],
            'lockedByUserName' => $row['LockedByUserName'],
            'lockedOn' => $row['LockedOn'],

            'isDeleted' => isset($row['IsDeleted']) ? (bool)$row['IsDeleted'] : false,
            'deletedAt' => isset($row['DeletedAt']) ? $row['DeletedAt'] : null,
            'deletedByName' => isset($row['DeletedByName']) ? $row['DeletedByName'] : null,
            'lastModified' => isset($row['LastModified']) ? $row['LastModified'] : null
        );
    }
    
    echo json_encode($files);
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Missing userId."));
}
?>
