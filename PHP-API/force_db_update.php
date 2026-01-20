<?php
include_once '../config/db.php';

echo "<h2>Database Update Debug</h2>";

// 1. Check if column exists
$checkSql = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Files' AND COLUMN_NAME = 'FileSize'";
$checkStmt = sqlsrv_query($conn, $checkSql);

if ($checkStmt === false) {
    die("Check Query Failed: " . print_r(sqlsrv_errors(), true));
}

if (sqlsrv_has_rows($checkStmt)) {
    echo "Column 'FileSize' ALREADY EXISTS.<br>";
} else {
    echo "Column 'FileSize' DOES NOT EXIST. Attempting to add...<br>";
    
    $alterSql = "ALTER TABLE Files ADD FileSize BIGINT DEFAULT 0";
    $alterStmt = sqlsrv_query($conn, $alterSql);
    
    if ($alterStmt === false) {
        die("ALTER TABLE Failed: " . print_r(sqlsrv_errors(), true));
    }
    echo "Column 'FileSize' ADDED SUCCESSFULLY.<br>";
}

// 2. Update sizes
echo "Updating file sizes...<br>";
$sql = "SELECT Id, FilePath FROM Files WHERE IsFolder = 0";
$stmt = sqlsrv_query($conn, $sql);

if ($stmt === false) {
    die("Select Files Failed: " . print_r(sqlsrv_errors(), true));
}

$count = 0;
while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    $filePath = $row['FilePath'];
    $id = $row['Id'];
    
    // Check if path is valid
    if (file_exists($filePath)) {
        $size = filesize($filePath);
        $updateSql = "UPDATE Files SET FileSize = ? WHERE Id = ?";
        $updateStmt = sqlsrv_query($conn, $updateSql, array($size, $id));
        
        if ($updateStmt === false) {
            echo "Failed to update ID $id: " . print_r(sqlsrv_errors(), true) . "<br>";
        } else {
            $count++;
        }
    } else {
        echo "File not found for ID $id: $filePath<br>";
    }
}

echo "Updated size for $count files.<br>";
?>
