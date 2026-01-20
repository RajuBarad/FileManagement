<?php
include_once '../config/db.php';
echo "CWD: " . getcwd() . "<br>";

$sql = "SELECT TOP 10 Id, FileName, FilePath, IsFolder, FileSize FROM Files";
$stmt = sqlsrv_query($conn, $sql);
if ($stmt) {
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        echo "<hr>";
        echo "ID: " . $row['Id'] . "<br>";
        echo "Name: " . $row['FileName'] . "<br>";
        echo "Path: " . $row['FilePath'] . "<br>";
        echo "Folder: " . var_export($row['IsFolder'], true) . "<br>";
        echo "Size: " . var_export($row['FileSize'], true) . "<br>";
    }
} else {
    echo "Query Error: " . print_r(sqlsrv_errors(), true);
}
?>
