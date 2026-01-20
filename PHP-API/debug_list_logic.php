<?php
// Standalone debug script for List Logic
$serverName = "DESKTOP-LS77LM0\SQLEXPRESS";
$connectionOptions = array(
    "Database" => "FileManagerDB",
    "Uid" => "sa",
    "PWD" => "abcd",
    "CharacterSet" => "UTF-8",
    "TrustServerCertificate" => true
);
$conn = sqlsrv_connect($serverName, $connectionOptions);
if ($conn === false) die(print_r(sqlsrv_errors(), true));

$userId = 4; // Hardcoded for testing User 4 (who has shares)

echo "Testing Shared List for User: $userId\n";

// The query from list.php
$sql = "SELECT CAST(f.Id AS NVARCHAR(36)) as Id, f.FileName, f.OwnerId, u.Username as OwnerName, gs.SharedWithUserId
        FROM Files f 
        JOIN Users u ON f.OwnerId = u.Id
        JOIN GenericShares gs ON f.Id = gs.FileId
        WHERE gs.SharedWithUserId = ? AND f.IsDeleted = 0";

$params = array($userId);

$stmt = sqlsrv_query($conn, $sql, $params);

if ($stmt === false) {
    echo "Query Failed:\n";
    print_r(sqlsrv_errors());
} else {
    $count = 0;
    while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        print_r($row);
        $count++;
    }
    echo "Total Rows Found: $count\n";
}
?>
