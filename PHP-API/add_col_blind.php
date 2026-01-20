<?php
include_once '../config/db.php';
$alterSql = "ALTER TABLE Files ADD FileSize BIGINT DEFAULT 0";
$stmt = sqlsrv_query($conn, $alterSql);
if($stmt) {
    echo "Column Added Successfully";
} else {
    echo "Error adding column: ";
    print_r(sqlsrv_errors());
}

// Then verify
$checkSql = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Files' AND COLUMN_NAME = 'FileSize'";
$stmt2 = sqlsrv_query($conn, $checkSql);
if ($stmt2 && sqlsrv_has_rows($stmt2)) {
    echo "<br>VERIFIED: Column Exists";
    
    // update data
    echo "<br>Updating Data...";
    $sql = "SELECT Id, FilePath FROM Files WHERE IsFolder = 0";
    $stmt3 = sqlsrv_query($conn, $sql);
    while($row = sqlsrv_fetch_array($stmt3, SQLSRV_FETCH_ASSOC)) {
        if(file_exists($row['FilePath'])) {
            $size = filesize($row['FilePath']);
            sqlsrv_query($conn, "UPDATE Files SET FileSize = ? WHERE Id = ?", array($size, $row['Id']));
        }
    }
    echo "<br>Data Updated.";
}
?>
