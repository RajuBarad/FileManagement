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
// Pagination
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 15;
$offset = ($page - 1) * $limit;

$searchTerm = "%" . $query . "%";

$sql = "
WITH MatchedFiles AS (
    SELECT f.Id, f.FileName, f.FilePath, f.IsFolder, f.FileSize, f.UploadDate, f.OwnerId, 
           f.ParentId, f.IsLocked, f.LockedByUserId, f.LockedOn
    FROM Files f
    WHERE (f.OwnerId = ? OR EXISTS (SELECT 1 FROM GenericShares fs WHERE fs.FileId = f.Id AND fs.SharedWithUserId = ?))
    AND f.FileName LIKE ?
),
PagedMatches AS (
    SELECT *
    FROM MatchedFiles
    ORDER BY IsFolder DESC, FileName ASC
    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
),
PathHierarchy AS (
    SELECT pm.Id as TargetFileId, f.Id as AncestorId, f.FileName as AncestorName, f.ParentId as AncestorParentId, 1 as Level
    FROM PagedMatches pm
    JOIN Files f ON pm.ParentId = f.Id
    UNION ALL
    SELECT ph.TargetFileId, f.Id, f.FileName, f.ParentId, ph.Level + 1
    FROM Files f
    JOIN PathHierarchy ph ON f.Id = ph.AncestorParentId
)
SELECT pm.*, 
       u.Username as OwnerName,
       CASE WHEN pm.OwnerId = ? THEN 'Owner' ELSE 'Read' END as AccessType,
       lu.Username as LockedByUserName,
       CASE WHEN sf.Id IS NOT NULL THEN 1 ELSE 0 END as IsStarred,
       ISNULL('Home' + 
          COALESCE(
            (
                SELECT ' > ' + AncestorName
                FROM PathHierarchy ph
                WHERE ph.TargetFileId = pm.Id
                ORDER BY Level DESC
                FOR XML PATH(''), TYPE
            ).value('.', 'NVARCHAR(MAX)'), 
            ''
          ), 
          'Home'
       ) + ' > ' + pm.FileName as LogicalPath
FROM PagedMatches pm
JOIN Users u ON pm.OwnerId = u.Id
LEFT JOIN Users lu ON pm.LockedByUserId = lu.Id
LEFT JOIN StarredFiles sf ON pm.Id = sf.FileId AND sf.UserId = ?
ORDER BY pm.IsFolder DESC, pm.FileName ASC"; 

$params = array($userId, $userId, $searchTerm, $offset, $limit, $userId, $userId);

$stmt = sqlsrv_query($conn, $sql, $params);

if ($stmt === false) {
    echo json_encode(array("message" => "Search failed.", "error" => sqlsrv_errors()));
    exit;
}

$files = array();

while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    // Generate secure URL
    // Actually we should just point to specific ID download
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
    $fileUrl = $protocol . "://" . $_SERVER['HTTP_HOST'] . "/files/download.php?id=" . $row['Id']; // Matches list.php pattern roughly

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
