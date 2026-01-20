<?php
include_once '../config/db.php';

$sql = "
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
BEGIN
    CREATE TABLE Notifications (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        Title NVARCHAR(255),
        Message NVARCHAR(MAX),
        Type VARCHAR(50), -- 'TaskAssignment', 'Comment'
        ReferenceId NVARCHAR(50),
        IsRead BIT DEFAULT 0,
        CreatedAt DATETIME DEFAULT GETDATE()
    );
END
";

if(sqlsrv_query($conn, $sql)) {
    echo "Notifications table created successfully.";
} else {
    print_r(sqlsrv_errors());
}
?>
