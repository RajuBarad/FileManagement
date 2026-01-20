<?php
include_once '../config/db.php';
$sql = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Files' AND COLUMN_NAME = 'FileSize'";
$stmt = sqlsrv_query($conn, $sql);
if ($stmt && sqlsrv_has_rows($stmt)) {
    echo "Column Exists";
} else {
    echo "Column Missing";
}
?>
