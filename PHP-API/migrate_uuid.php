<?php
include_once 'config/db.php';

$sql = "
    IF OBJECT_ID('GenericShares', 'U') IS NOT NULL DROP TABLE GenericShares;
    IF OBJECT_ID('Files', 'U') IS NOT NULL DROP TABLE Files;

    CREATE TABLE Files (
        Id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        FileName NVARCHAR(255) NOT NULL,
        FilePath NVARCHAR(MAX) NOT NULL,
        OwnerId INT NOT NULL,
        IsShared BIT DEFAULT 0,
        ParentId UNIQUEIDENTIFIER NULL,
        IsFolder BIT DEFAULT 0,
        UploadDate DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (OwnerId) REFERENCES Users(Id)
    );

    CREATE TABLE GenericShares (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        FileId UNIQUEIDENTIFIER NOT NULL,
        SharedWithUserId INT NULL,
        Permission NVARCHAR(50) DEFAULT 'Read',
        SharedDate DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (FileId) REFERENCES Files(Id),
        FOREIGN KEY (SharedWithUserId) REFERENCES Users(Id)
    );
";

if(sqlsrv_query($conn, $sql)) {
    echo "Migration Successful: Files table updated to use UUID.";
} else {
    echo "Migration Failed: <br>";
    print_r(sqlsrv_errors());
}
?>
