<?php
include_once 'config/db.php';

header("Content-Type: application/json; charset=UTF-8");

$queries = [
    // 1. Hierarchy & Auth Columns
    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'ParentUserId' AND Object_ID = Object_ID(N'Users'))
    BEGIN
        ALTER TABLE Users ADD ParentUserId NVARCHAR(36) NULL;
    END",

    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'AuthToken' AND Object_ID = Object_ID(N'Users'))
    BEGIN
        ALTER TABLE Users ADD AuthToken NVARCHAR(255) NULL;
    END",

    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'ParentTaskId' AND Object_ID = Object_ID(N'Tasks'))
    BEGIN
        ALTER TABLE Tasks ADD ParentTaskId NVARCHAR(36) NULL;
    END",

    // 2. File Columns
    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Files]') AND name = 'FileSize')
    BEGIN
        ALTER TABLE Files ADD FileSize BIGINT NULL;
    END",

    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Files]') AND name = 'IsLocked')
    BEGIN
        ALTER TABLE Files ADD IsLocked BIT DEFAULT 0;
    END",

    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Files]') AND name = 'LockedByUserId')
    BEGIN
        ALTER TABLE Files ADD LockedByUserId INT NULL;
    END",

    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Files]') AND name = 'LockedOn')
    BEGIN
        ALTER TABLE Files ADD LockedOn DATETIME NULL;
    END",

    // 3. BoardSections Table
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
    END",

    // 4. Tasks Table
    "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Tasks]') AND type in (N'U'))
    BEGIN
        CREATE TABLE Tasks (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            Title NVARCHAR(255) NOT NULL,
            Description NVARCHAR(MAX) NULL,
            Priority NVARCHAR(50) DEFAULT 'Medium',
            DueDate DATETIME NULL,
            CreatedByUserId INT NOT NULL,
            AssignedToUserId INT NULL,
            Status NVARCHAR(50) DEFAULT 'Pending',
            ParentTaskId NVARCHAR(36) NULL,
            CreatedAt DATETIME DEFAULT GETDATE(),
            FOREIGN KEY (CreatedByUserId) REFERENCES Users(Id)
        );
    END",

    // 5. TaskAssignments Table
    "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[TaskAssignments]') AND type in (N'U'))
    BEGIN
        CREATE TABLE TaskAssignments (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            TaskId INT NOT NULL,
            UserId INT NOT NULL,
            AssignedAt DATETIME DEFAULT GETDATE(),
            FOREIGN KEY (TaskId) REFERENCES Tasks(Id) ON DELETE CASCADE,
            FOREIGN KEY (UserId) REFERENCES Users(Id)
        );
    END",

    // 6. StarredFiles Table
    "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[StarredFiles]') AND type in (N'U'))
    BEGIN
        CREATE TABLE StarredFiles (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            FileId UNIQUEIDENTIFIER NOT NULL,
            UserId INT NOT NULL,
            StarredAt DATETIME DEFAULT GETDATE(),
            FOREIGN KEY (FileId) REFERENCES Files(Id) ON DELETE CASCADE,
            FOREIGN KEY (UserId) REFERENCES Users(Id)
        );
    END",

    // 7. Notifications Table
    "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Notifications]') AND type in (N'U'))
    BEGIN
        CREATE TABLE Notifications (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            UserId INT NOT NULL,
            Title NVARCHAR(255) NOT NULL,
            Message NVARCHAR(MAX) NOT NULL,
            Type NVARCHAR(50) NOT NULL,
            ReferenceId INT NULL,
            IsRead BIT DEFAULT 0,
            CreatedAt DATETIME DEFAULT GETDATE(),
            FOREIGN KEY (UserId) REFERENCES Users(Id)
        );
    END",

    // 8. UserActivityLogs Table
    "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[UserActivityLogs]') AND type in (N'U'))
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
    END",

    // 9. UserPermissions Table
    "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[UserPermissions]') AND type in (N'U'))
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
    END",

    // 10. UserPermissions Operations Column
    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[UserPermissions]') AND name = 'Operations')
    BEGIN
        ALTER TABLE UserPermissions ADD Operations NVARCHAR(MAX) NULL DEFAULT '{}';
    END"
];


$executed = 0;
foreach ($queries as $sql) {
    $stmt = sqlsrv_query($conn, $sql);
    if ($stmt === false) {
        die(json_encode(array("status" => "error", "error" => sqlsrv_errors())));
    }
    $executed++;
}

echo json_encode(array(
    "status" => "success",
    "message" => "All database migrations executed successfully ($executed queries processed)."
));
?>
