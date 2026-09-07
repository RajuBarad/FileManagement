<?php
// PHP-API/create_user_permissions_table.php
include_once 'config/db.php';

header("Content-Type: application/json; charset=UTF-8");

$sql = "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[UserPermissions]') AND type in (N'U'))
BEGIN
    CREATE TABLE UserPermissions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        ModuleKey NVARCHAR(50) NOT NULL,
        CanView BIT NOT NULL DEFAULT 0,
        CanAdd BIT NOT NULL DEFAULT 0,
        CanUpdate BIT NOT NULL DEFAULT 0,
        CanDelete BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_UserPermissions_User FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
        CONSTRAINT UQ_User_Module UNIQUE (UserId, ModuleKey)
    );
    CREATE INDEX IX_UserPermissions_UserId ON UserPermissions (UserId);
    CREATE INDEX IX_UserPermissions_ModuleKey ON UserPermissions (ModuleKey);
END";

$stmt = sqlsrv_query($conn, $sql);
if ($stmt === false) {
    http_response_code(500);
    echo json_encode(["status" => "error", "error" => sqlsrv_errors()]);
    exit;
}

echo json_encode([
    "status" => "success",
    "message" => "UserPermissions table created or already exists."
]);
?>
