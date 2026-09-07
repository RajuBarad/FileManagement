<?php
include_once 'config/db.php';
header("Content-Type: application/json; charset=UTF-8");

$sql = "
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[UserActivityLogs]') AND type in (N'U'))
BEGIN
    CREATE TABLE UserActivityLogs (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NULL,
        UserName NVARCHAR(100) NULL,
        UserRole NVARCHAR(50) NULL,
        Module NVARCHAR(50) NOT NULL,
        Action NVARCHAR(100) NOT NULL,
        EntityName NVARCHAR(255) NULL,
        EntityId NVARCHAR(100) NULL,
        Details NVARCHAR(MAX) NULL,
        IpAddress NVARCHAR(50) NULL,
        CreatedAt DATETIME DEFAULT GETDATE()
    );
    CREATE INDEX IX_UserActivityLogs_Module ON UserActivityLogs(Module);
    CREATE INDEX IX_UserActivityLogs_UserId ON UserActivityLogs(UserId);
    CREATE INDEX IX_UserActivityLogs_CreatedAt ON UserActivityLogs(CreatedAt DESC);
END
";

$stmt = sqlsrv_query($conn, $sql);
if ($stmt === false) {
    echo json_encode(array("status" => "error", "error" => sqlsrv_errors()));
} else {
    echo json_encode(array("status" => "success", "message" => "UserActivityLogs table ensured successfully."));
}
?>
