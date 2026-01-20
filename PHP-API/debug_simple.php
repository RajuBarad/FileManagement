<?php
$serverName = "DESKTOP-LS77LM0\SQLEXPRESS";
$connectionOptions = array(
    "Database" => "FileManagerDB",
    "Uid" => "sa",
    "PWD" => "abcd",
    "CharacterSet" => "UTF-8",
    "TrustServerCertificate" => true
);

$conn = sqlsrv_connect($serverName, $connectionOptions);

if ($conn === false) {
    die(print_r(sqlsrv_errors(), true));
}

echo "Connected.\n";

$sql = "SELECT * FROM GenericShares";
$stmt = sqlsrv_query($conn, $sql);
if ($stmt === false) die(print_r(sqlsrv_errors(), true));

$shares = 0;
while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    print_r($row);
    $shares++;
    
    // Check File Status
    $fid = $row['FileId'];
    $sql3 = "SELECT Id, FileName, IsDeleted, OwnerId FROM Files WHERE Id = '$fid'";
    $stmt3 = sqlsrv_query($conn, $sql3);
    if ($stmt3 && $fileRow = sqlsrv_fetch_array($stmt3, SQLSRV_FETCH_ASSOC)) {
        echo "   -> File: " . $fileRow['FileName'] . " (Deleted: " . $fileRow['IsDeleted'] . ", Owner: " . $fileRow['OwnerId'] . ")\n";
    } else {
        echo "   -> File NOT FOUND in Files table!\n";
    }
}
echo "Total Shares: $shares\n";

$sql2 = "SELECT count(*) as cnt FROM Users";
$stmt2 = sqlsrv_query($conn, $sql2);
$row2 = sqlsrv_fetch_array($stmt2, SQLSRV_FETCH_ASSOC);
echo "Total Users: " . $row2['cnt'] . "\n";
?>
