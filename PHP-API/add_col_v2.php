<?php
// Manual connection to verify everything
$serverName = "DESKTOP-LS77LM0\SQLEXPRESS";
$connectionOptions = array(
    "Database" => "FileManagerDB",
    "Uid" => "sa",
    "PWD" => "abcd",
    "CharacterSet" => "UTF-8",
    "TrustServerCertificate" => true
);
$conn = sqlsrv_connect($serverName, $connectionOptions);

if($conn === false) {
    die("Connection Failed: " . print_r(sqlsrv_errors(), true));
}

echo "Connected. Resource: " . get_resource_type($conn) . "<br>";

$alterSql = "ALTER TABLE Files ADD FileSize BIGINT DEFAULT 0";

// Try with explicit null/empty array
$stmt = sqlsrv_query($conn, $alterSql, array());

if($stmt) {
    echo "Column Added Successfully<br>";
} else {
    $errors = sqlsrv_errors();
    // Check if error is "Column already exists" (SQLState 42S21 or similar check)
    // Actually, just print it.
    echo "Query Failed: <pre>" . print_r($errors, true) . "</pre><br>";
}

// Update Step
$sql = "SELECT Id, FilePath FROM Files WHERE IsFolder = 0";
$stmt2 = sqlsrv_query($conn, $sql);
if($stmt2) {
    echo "Updating file sizes...<br>";
    $count = 0;
    while($row = sqlsrv_fetch_array($stmt2, SQLSRV_FETCH_ASSOC)) {
        if(file_exists($row['FilePath'])) {
            $size = filesize($row['FilePath']);
            $upd = "UPDATE Files SET FileSize = ? WHERE Id = ?";
            sqlsrv_query($conn, $upd, array($size, $row['Id']));
            $count++;
        }
    }
    echo "Updated $count files.<br>";
} else {
    echo "Failed to select files.<br>";
}
?>
