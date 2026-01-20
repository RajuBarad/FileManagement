<?php
include_once 'config/db.php';
// Hardcode a user ID that definitely exists and has shared files if possible, or use the one from logs
$userId = 1; 

$sql = "SELECT CAST(f.Id AS NVARCHAR(36)) as Id, f.FileName, u.Username as OwnerName
        FROM Files f 
        JOIN Users u ON f.OwnerId = u.Id
        WHERE f.ParentId IS NOT NULL"; // Just grab some files in folders

$stmt = sqlsrv_query($conn, $sql);
if($stmt === false) {
    print_r(sqlsrv_errors());
}

echo "<h3>Direct DB Query Check:</h3>";
while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    echo "File: " . $row['FileName'] . " - OwnerName: " . $row['OwnerName'] . "<br>";
}
?>
