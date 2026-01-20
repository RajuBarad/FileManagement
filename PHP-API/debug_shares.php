<?php
include_once 'config/db.php';

echo "<h2>GenericShares Table</h2>";
$sql = "SELECT gs.Id, gs.FileId, f.FileName, gs.SharedWithUserId, u.Username as SharedWithName, gs.Permission 
        FROM GenericShares gs
        LEFT JOIN Files f ON gs.FileId = f.Id
        LEFT JOIN Users u ON gs.SharedWithUserId = u.Id";
$stmt = sqlsrv_query($conn, $sql);

if ($stmt === false) {
    die(print_r(sqlsrv_errors(), true));
}

echo "<table border='1'><tr><th>Id</th><th>FileId</th><th>FileName</th><th>SharedWithUserId</th><th>SharedWithName</th><th>Permission</th></tr>";
while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    echo "<tr>";
    foreach ($row as $key => $val) {
        echo "<td>" . $val . "</td>";
    }
    echo "</tr>";
}
echo "</table>";

echo "<h2>Users Table</h2>";
$sqlUsers = "SELECT Id, Username FROM Users";
$stmtUsers = sqlsrv_query($conn, $sqlUsers);
echo "<table border='1'><tr><th>Id</th><th>Username</th></tr>";
while ($row = sqlsrv_fetch_array($stmtUsers, SQLSRV_FETCH_ASSOC)) {
    echo "<tr><td>" . $row['Id'] . "</td><td>" . $row['Username'] . "</td></tr>";
}
echo "</table>";
?>
