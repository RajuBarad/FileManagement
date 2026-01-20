<?php
include_once 'config/db.php';

$sql = "
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TaskAttachments' AND xtype='U')
BEGIN
    CREATE TABLE TaskAttachments (
        Id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        TaskId UNIQUEIDENTIFIER NOT NULL,
        FileId UNIQUEIDENTIFIER NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (TaskId) REFERENCES Tasks(Id) ON DELETE CASCADE,
        FOREIGN KEY (FileId) REFERENCES Files(Id) ON DELETE CASCADE
    );
    PRINT 'TaskAttachments table created successfully.';
END
ELSE
BEGIN
    PRINT 'TaskAttachments table already exists.';
END
";

$stmt = sqlsrv_query($conn, $sql);

if ($stmt === false) {
    die(print_r(sqlsrv_errors(), true));
} else {
    echo "TaskAttachments table check/creation executed.";
}
?>
