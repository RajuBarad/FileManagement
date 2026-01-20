<?php
include_once 'config/db.php';

$userId = 1; // Assuming user 1
$query = ''; // Empty query to list all

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
SELECT TOP 20 f.FileName, f.IsFolder, f.ParentId, ISNULL(fp.FullPath, 'Home') as LogicalPath
FROM Files f
LEFT JOIN FolderPaths fp ON f.ParentId = fp.Id
WHERE f.OwnerId = ? AND f.IsFolder = 0
ORDER BY f.FileName ASC";

$params = array($userId);
$stmt = sqlsrv_query($conn, $sql, $params);

if ($stmt === false) {
    die(print_r(sqlsrv_errors(), true));
}

echo "FileName | ParentId | LogicalPath\n";
echo "---------------------------------\n";
while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    echo $row['FileName'] . " | " . ($row['ParentId'] ?? 'NULL') . " | " . $row['LogicalPath'] . "\n";
}
?>
