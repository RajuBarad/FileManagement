<?php
include_once 'config/db.php';

$sql = "
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='StarredFiles' AND xtype='U')
BEGIN
    CREATE TABLE StarredFiles (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        FileId UNIQUEIDENTIFIER NOT NULL,
        StarredAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (UserId) REFERENCES Users(Id),
        FOREIGN KEY (FileId) REFERENCES Files(Id)
    );
END
";

$stmt = sqlsrv_query($conn, $sql);

if($stmt) {
    echo "StarredFiles table created or already exists.";
} else {
    print_r(sqlsrv_errors());
}
?>
