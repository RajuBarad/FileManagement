<?php
include_once 'config/db.php';

$updates = [
    "IsLocked" => "IF COL_LENGTH('Files', 'IsLocked') IS NULL ALTER TABLE Files ADD IsLocked BIT DEFAULT 0;",
    "LockedByUserId" => "IF COL_LENGTH('Files', 'LockedByUserId') IS NULL ALTER TABLE Files ADD LockedByUserId INT NULL;",
    "LockedOn" => "IF COL_LENGTH('Files', 'LockedOn') IS NULL ALTER TABLE Files ADD LockedOn DATETIME NULL;",
    "FK_LockedBy" => "IF OBJECT_ID('FK_Files_LockedBy', 'F') IS NULL ALTER TABLE Files ADD CONSTRAINT FK_Files_LockedBy FOREIGN KEY (LockedByUserId) REFERENCES Users(Id);"
];

foreach ($updates as $key => $sql) {
    $stmt = sqlsrv_query($conn, $sql);
    if ($stmt) {
        echo "Executed check/update for $key.<br>";
    } else {
        echo "Error for $key: ";
        print_r(sqlsrv_errors());
        echo "<br>";
    }
}

echo "Database schema update check complete.";
?>
