<?php
include_once 'config/db.php';

$sql = "
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TaskComments' AND xtype='U')
BEGIN
    CREATE TABLE TaskComments (
        Id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        TaskId UNIQUEIDENTIFIER NOT NULL,
        UserId INT NOT NULL,
        Comment NVARCHAR(MAX) NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (TaskId) REFERENCES Tasks(Id) ON DELETE CASCADE,
        FOREIGN KEY (UserId) REFERENCES Users(Id)
    );
    PRINT 'TaskComments table created successfully.';
END
ELSE
BEGIN
    PRINT 'TaskComments table already exists.';
END
";

$stmt = sqlsrv_query($conn, $sql);

if ($stmt === false) {
    die(print_r(sqlsrv_errors(), true));
} else {
    echo "TaskComments table check/creation executed.";
}
?>
