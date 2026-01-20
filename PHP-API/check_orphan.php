<?php
include_once 'config/db.php';
$name = 'MilkBackup_20251221_2106.json';
$sql = "SELECT f.Id, f.FileName, f.ParentId, p.FileName as ParentName 
        FROM Files f 
        LEFT JOIN Files p ON f.ParentId = p.Id 
        WHERE f.FileName = ?";
$stmt = sqlsrv_query($conn, $sql, array($name));
if($stmt) {
    while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        print_r($row);
        echo "Parent Exists: " . ($row['ParentName'] ? 'Yes' : 'No') . "\n";
    }
} else {
    print_r(sqlsrv_errors());
}
?>
