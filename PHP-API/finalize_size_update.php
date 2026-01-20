<?php
include_once 'config/db.php'; // Correct path from PHP-API/ root

echo "Connected. Updating sizes...<br>";

$sql = "SELECT Id, FilePath FROM Files WHERE IsFolder = 0";
$stmt = sqlsrv_query($conn, $sql);

if ($stmt) {
    $count = 0;
    while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $dbPath = $row['FilePath']; // e.g., "../uploads/file.txt"
        
        // We are in PHP-API/. The uploads folder is in PHP-API/uploads/
        // DB path is relative to PHP-API/files/ (where upload.php is)
        // So "../uploads/" relative to "files/" is "uploads/" relative to "PHP-API/"
        
        $localPath = str_replace('../uploads/', 'uploads/', $dbPath);
        
        // Handle cases where path might be just "uploads/" already or something else
        if (!file_exists($localPath)) {
            // Try raw path just in case
            if (file_exists($dbPath)) {
                $localPath = $dbPath;
            } else {
                 // Try absolute path assuming typical structure
                 $localPath = __DIR__ . '/uploads/' . basename($dbPath);
            }
        }

        if (file_exists($localPath)) {
            $size = filesize($localPath);
            $upd = "UPDATE Files SET FileSize = ? WHERE Id = ?";
            sqlsrv_query($conn, $upd, array($size, $row['Id']));
            echo "Updated " . $row['Id'] . " (" . basename($dbPath) . ") -> " . $size . " bytes<br>";
            $count++;
        } else {
            echo "File not found: " . $localPath . " (DB: $dbPath)<br>";
        }
    }
    echo "Done. Updated $count files.";
} else {
    echo "Query Error: " . print_r(sqlsrv_errors(), true);
}
?>
