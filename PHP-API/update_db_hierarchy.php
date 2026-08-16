<?php
include_once 'config/db.php';

$queries = [
    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'ParentUserId' AND Object_ID = Object_ID(N'Users'))
    BEGIN
        ALTER TABLE Users ADD ParentUserId NVARCHAR(36) NULL;
    END",

    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'ParentTaskId' AND Object_ID = Object_ID(N'Tasks'))
    BEGIN
        ALTER TABLE Tasks ADD ParentTaskId NVARCHAR(36) NULL;
    END"
];

foreach ($queries as $sql) {
    $stmt = sqlsrv_query($conn, $sql);
    if ($stmt === false) {
        die(json_encode(array("error" => sqlsrv_errors())));
    }
}

echo json_encode(array("message" => "Database hierarchy columns (ParentUserId, ParentTaskId) verified/created successfully."));
?>
