<?php
include_once 'config/db.php';
$id = '07AE9F78-715D-48BB-85BB-89C59058FE08';
$sql = "SELECT * FROM Files WHERE Id = ?";
$stmt = sqlsrv_query($conn, $sql, array($id));
if($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    print_r($row);
} else {
    echo "Folder not found.";
}
?>
