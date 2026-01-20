<?php
include_once '../config/db.php';

$sql = "
IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'CompletedAt' AND Object_ID = Object_ID(N'Tasks'))
BEGIN
    ALTER TABLE Tasks ADD CompletedAt DATETIME NULL;
END
";

if(sqlsrv_query($conn, $sql)) {
    echo "CompletedAt column checked/added.";
} else {
    print_r(sqlsrv_errors());
}
?>
