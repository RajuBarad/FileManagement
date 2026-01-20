<?php
include_once '../config/db.php';

$sql = "
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TaskComments' and xtype='U')
CREATE TABLE TaskComments (
    Id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    TaskId UNIQUEIDENTIFIER NOT NULL,
    UserId INT NOT NULL,
    Content NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (TaskId) REFERENCES Tasks(Id) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(Id)
)";

if(sqlsrv_query($conn, $sql)) {
    echo "TaskComments table created successfully.";
} else {
    print_r(sqlsrv_errors());
}
?>
