<?php
include_once '../config/db.php';

echo "<h2>Debug Users</h2>";

$sql = "SELECT Id, Username, Password FROM Users";
$stmt = sqlsrv_query($conn, $sql);

if ($stmt === false) {
    die(print_r(sqlsrv_errors(), true));
}

while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    echo "ID: " . $row['Id'] . "<br>";
    echo "Username: " . $row['Username'] . "<br>";
    echo "Hash: " . $row['Password'] . "<br>";
    
    $testPass = 'password';
    $verify = password_verify($testPass, $row['Password']);
    echo "Verify 'password': " . ($verify ? 'Match' : 'No Match') . "<br>";
    echo "<hr>";
}
?>
