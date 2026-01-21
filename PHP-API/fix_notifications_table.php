<?php
include_once 'config/db.php';

header('Content-Type: text/plain');

$queries = [
    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Notifications]') AND name = 'RelatedId')
    BEGIN
        ALTER TABLE Notifications ADD RelatedId UNIQUEIDENTIFIER NULL;
    END",
    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Notifications]') AND name = 'Type')
    BEGIN
        ALTER TABLE Notifications ADD Type NVARCHAR(50) DEFAULT 'Info';
    END"
];

foreach ($queries as $q) {
    $stmt = sqlsrv_query($conn, $q);
    if ($stmt === false) {
        echo "Error: ";
        print_r(sqlsrv_errors());
        echo "\n";
    } else {
        echo "Success\n";
    }
}
echo "Done.";
?>
