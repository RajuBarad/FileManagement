<?php
include_once 'config/db.php';

$sql = "
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Tasks' AND xtype='U')
BEGIN
    CREATE TABLE Tasks (
        Id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        Title NVARCHAR(255) NOT NULL,
        Description NVARCHAR(MAX),
        AssignedToUserId INT NOT NULL,
        CreatedByUserId INT NOT NULL,
        Status NVARCHAR(50) DEFAULT 'Pending', -- Pending, In Progress, Completed
        Priority NVARCHAR(20) DEFAULT 'Medium', -- Low, Medium, High
        DueDate DATETIME,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME,
        FOREIGN KEY (AssignedToUserId) REFERENCES Users(Id),
        FOREIGN KEY (CreatedByUserId) REFERENCES Users(Id)
    );
    PRINT 'Tasks table created successfully.';
END
ELSE
BEGIN
    PRINT 'Tasks table already exists.';
END
";

$stmt = sqlsrv_query($conn, $sql);

if ($stmt === false) {
    die(print_r(sqlsrv_errors(), true));
} else {
    echo "Files added successfully (if not existed). Check server logs/output.";
    // sqlsrv_query doesn't return print output easily, so we assume success if no error.
    echo "Command executed.";
}
?>
