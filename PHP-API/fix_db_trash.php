<?php
include_once 'config/db.php';

function runQuery($conn, $sql, $msg) {
    if(sqlsrv_query($conn, $sql)) {
        echo "$msg: Success<br>";
    } else {
        echo "$msg: Failed (might already exist or error)<br>";
        print_r(sqlsrv_errors());
        echo "<br>";
    }
}

echo "Fixing Trash Columns...<br>";

// IsDeleted
$sql1 = "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Files') AND name = N'IsDeleted')
BEGIN
    ALTER TABLE Files ADD IsDeleted BIT DEFAULT 0;
END";
runQuery($conn, $sql1, "Add IsDeleted");

// DeletedAt
$sql2 = "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Files') AND name = N'DeletedAt')
BEGIN
    ALTER TABLE Files ADD DeletedAt DATETIME NULL;
END";
runQuery($conn, $sql2, "Add DeletedAt");

// LastModified
$sql3 = "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Files') AND name = N'LastModified')
BEGIN
    ALTER TABLE Files ADD LastModified DATETIME DEFAULT GETDATE();
END";
runQuery($conn, $sql3, "Add LastModified");

// Update existing nulls
$sql4 = "UPDATE Files SET IsDeleted = 0 WHERE IsDeleted IS NULL";
runQuery($conn, $sql4, "Initialize IsDeleted");

$sql5 = "UPDATE Files SET LastModified = UploadDate WHERE LastModified IS NULL";
runQuery($conn, $sql5, "Initialize LastModified");

echo "Done.";
?>
