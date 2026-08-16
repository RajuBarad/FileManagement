<?php
include_once 'config/db.php';

$queries = [
    "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BoardSections]') AND type in (N'U'))
    BEGIN
        CREATE TABLE BoardSections (
            Id NVARCHAR(100) PRIMARY KEY,
            Name NVARCHAR(100) NOT NULL,
            Color NVARCHAR(50) NOT NULL DEFAULT 'indigo',
            IsCustom BIT NOT NULL DEFAULT 0,
            IsCompletedSection BIT NOT NULL DEFAULT 0,
            SortOrder INT NOT NULL DEFAULT 0
        );
    END",

    "IF NOT EXISTS (SELECT * FROM BoardSections WHERE Id = 'Pending')
    BEGIN
        INSERT INTO BoardSections (Id, Name, Color, IsCustom, IsCompletedSection, SortOrder) VALUES ('Pending', 'To Do', 'gray', 0, 0, 1);
    END",
    "IF NOT EXISTS (SELECT * FROM BoardSections WHERE Id = 'In Progress')
    BEGIN
        INSERT INTO BoardSections (Id, Name, Color, IsCustom, IsCompletedSection, SortOrder) VALUES ('In Progress', 'In Progress', 'blue', 0, 0, 2);
    END",
    "IF NOT EXISTS (SELECT * FROM BoardSections WHERE Id = 'Review')
    BEGIN
        INSERT INTO BoardSections (Id, Name, Color, IsCustom, IsCompletedSection, SortOrder) VALUES ('Review', 'Review', 'purple', 0, 0, 3);
    END",
    "IF NOT EXISTS (SELECT * FROM BoardSections WHERE Id = 'Done')
    BEGIN
        INSERT INTO BoardSections (Id, Name, Color, IsCustom, IsCompletedSection, SortOrder) VALUES ('Done', 'Done', 'green', 0, 1, 4);
    END"
];

foreach ($queries as $sql) {
    $stmt = sqlsrv_query($conn, $sql);
    if ($stmt === false) {
        die(json_encode(array("error" => sqlsrv_errors())));
    }
}

echo json_encode(array("message" => "BoardSections table verified/created successfully."));
?>
