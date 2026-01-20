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

echo "Updating Schema for DeletedBy...<br>";

// DeletedByUserId
$sql = "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Files') AND name = N'DeletedByUserId')
BEGIN
    ALTER TABLE Files ADD DeletedByUserId INT NULL;
END";
runQuery($conn, $sql, "Add DeletedByUserId");

echo "Done.";
?>
