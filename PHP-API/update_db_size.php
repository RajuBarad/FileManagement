<?php
include_once '../config/db.php';

// 1. Add Column if not exists
$checkSql = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Files' AND COLUMN_NAME = 'FileSize'";
$checkStmt = sqlsrv_query($conn, $checkSql);
if ($checkStmt && !sqlsrv_has_rows($checkStmt)) {
    $alterSql = "ALTER TABLE Files ADD FileSize BIGINT DEFAULT 0";
    if(sqlsrv_query($conn, $alterSql)) {
        echo "Column FileSize added.<br>";
    } else {
        die("Failed to add column: " . print_r(sqlsrv_errors(), true));
    }
} else {
    echo "Column FileSize already exists.<br>";
}

// 2. Update existing files
$sql = "SELECT Id, FilePath FROM Files WHERE IsFolder = 0";
$stmt = sqlsrv_query($conn, $sql);

if($stmt) {
    while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $filePath = $row['FilePath'];
        if(file_exists($filePath)) {
            $size = filesize($filePath);
            $updateSql = "UPDATE Files SET FileSize = ? WHERE Id = ?";
            $updateStmt = sqlsrv_query($conn, $updateSql, array($size, $row['Id']));
            if($updateStmt) {
                echo "Updated " . $row['Id'] . " size: $size<br>";
            }
        }
    }
}
echo "Done.";
?>
