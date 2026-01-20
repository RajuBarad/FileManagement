<?php

include_once '../config/db.php';

$userId = isset($_GET['userId']) ? $_GET['userId'] : die();
$query = isset($_GET['query']) ? $_GET['query'] : '';

if (strlen($query) < 1) {
    echo json_encode([]);
    exit;
}

// Search for files owned by user OR shared with user
// Similar logic to list.php but filtering by name
// Search for files owned by user OR shared with user
// CTE to get full logical path for Folders
$sql = "
WITH FolderPaths (Id, FullPath) AS (
    SELECT Id, CAST('Home > ' + FileName AS NVARCHAR(MAX))
    FROM Files
    WHERE ParentId IS NULL AND IsFolder = 1
    UNION ALL
    SELECT f.Id, CAST(p.FullPath + ' > ' + f.FileName AS NVARCHAR(MAX))
    FROM Files f
    JOIN FolderPaths p ON f.ParentId = p.Id
    WHERE f.IsFolder = 1
)
SELECT DISTINCT f.Id, f.FileName, f.FilePath, f.IsFolder, f.FileSize, f.UploadDate, f.OwnerId, 
        f.ParentId, u.Username as OwnerName,
        CASE WHEN f.OwnerId = ? THEN 'Owner' ELSE 'Read' END as AccessType,
        f.IsLocked, f.LockedByUserId, f.LockedOn, lu.Username as LockedByUserName,
        CASE WHEN sf.Id IS NOT NULL THEN 1 ELSE 0 END as IsStarred,
        CASE 
            WHEN f.ParentId IS NOT NULL AND fp.Id IS NULL THEN 'Orphaned > ' + f.FileName 
            ELSE ISNULL(fp.FullPath, 'Home') + ' > ' + f.FileName 
        END as LogicalPath
        FROM Files f
        JOIN Users u ON f.OwnerId = u.Id
        LEFT JOIN Users lu ON f.LockedByUserId = lu.Id
        LEFT JOIN GenericShares fs ON f.Id = fs.FileId
        LEFT JOIN StarredFiles sf ON f.Id = sf.FileId AND sf.UserId = ?
        LEFT JOIN FolderPaths fp ON f.ParentId = fp.Id
        WHERE (f.OwnerId = ? OR fs.SharedWithUserId = ?)
        AND f.FileName LIKE ?
        ORDER BY f.IsFolder DESC, f.FileName ASC"; 

$searchTerm = "%" . $query . "%";
$params = array($userId, $userId, $userId, $userId, $searchTerm);

$stmt = sqlsrv_query($conn, $sql, $params);

if ($stmt === false) {
    echo json_encode(array("message" => "Search failed.", "error" => sqlsrv_errors()));
    exit;
}

$files = array();

while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    // Generate secure URL
    // Actually we should just point to specific ID download
    $fileUrl = "http://localhost:888/files/download.php?id=" . $row['Id']; // Matches list.php pattern roughly

    $files[] = array(
        "id" => $row['Id'],
        "name" => $row['FileName'],
        "type" => $row['IsFolder'] ? 'folder' : 'file', // logic mainly in frontend for extension
        "size" => $row['FileSize'],
        "lastModified" => $row['UploadDate'] ? $row['UploadDate']->format('Y-m-d H:i:s') : null,
        "ownerId" => $row['OwnerId'],
        "ownerName" => $row['OwnerName'],
        "parentId" => $row['ParentId'],
        "accessType" => $row['AccessType'],
        "url" => $fileUrl,
        "isStarred" => isset($row['IsStarred']) ? (bool)$row['IsStarred'] : false,
        "isLocked" => isset($row['IsLocked']) ? (bool)$row['IsLocked'] : false,
        "lockedByUserId" => isset($row['LockedByUserId']) ? $row['LockedByUserId'] : null,
        "lockedByUserName" => isset($row['LockedByUserName']) ? $row['LockedByUserName'] : null,
        "lockedOn" => isset($row['LockedOn']) ? $row['LockedOn']->format('Y-m-d H:i:s') : null,
        "path" => $row['LogicalPath'] // Use Logical Path (Breadcrumb)
    );
}

echo json_encode($files);
?>
