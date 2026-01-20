USE FileManagerDB;
GO

-- =============================================
-- Migration Script
-- Generated On: 2026-01-08
-- Description: Updates production schema to match dev environment.
-- =============================================

-- 1. Updates to Files Table
-- Add FileSize
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Files]') AND name = 'FileSize')
BEGIN
    ALTER TABLE Files ADD FileSize BIGINT NULL;
    PRINT 'Added FileSize column to Files table.';
END
GO

-- Add IsLocked
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Files]') AND name = 'IsLocked')
BEGIN
    ALTER TABLE Files ADD IsLocked BIT DEFAULT 0;
    PRINT 'Added IsLocked column to Files table.';
END
GO

-- Add LockedByUserId
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Files]') AND name = 'LockedByUserId')
BEGIN
    ALTER TABLE Files ADD LockedByUserId INT NULL;
    PRINT 'Added LockedByUserId column to Files table.';
END
GO

-- Add LockedOn
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Files]') AND name = 'LockedOn')
BEGIN
    ALTER TABLE Files ADD LockedOn DATETIME NULL;
    PRINT 'Added LockedOn column to Files table.';
END
GO

-- 2. New Tables

-- Tasks
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Tasks]') AND type in (N'U'))
BEGIN
    CREATE TABLE Tasks (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(255) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        Priority NVARCHAR(50) DEFAULT 'Medium',
        DueDate DATETIME NULL,
        CreatedByUserId INT NOT NULL,
        AssignedToUserId INT NULL, -- Legacy/Primary support
        Status NVARCHAR(50) DEFAULT 'Pending',
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (CreatedByUserId) REFERENCES Users(Id)
    );
    PRINT 'Created Tasks table.';
END
GO

-- TaskAssignments
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[TaskAssignments]') AND type in (N'U'))
BEGIN
    CREATE TABLE TaskAssignments (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TaskId INT NOT NULL,
        UserId INT NOT NULL,
        AssignedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (TaskId) REFERENCES Tasks(Id) ON DELETE CASCADE,
        FOREIGN KEY (UserId) REFERENCES Users(Id)
    );
    PRINT 'Created TaskAssignments table.';
END
GO

-- StarredFiles
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[StarredFiles]') AND type in (N'U'))
BEGIN
    CREATE TABLE StarredFiles (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        FileId UNIQUEIDENTIFIER NOT NULL,
        UserId INT NOT NULL,
        StarredAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (FileId) REFERENCES Files(Id) ON DELETE CASCADE,
        FOREIGN KEY (UserId) REFERENCES Users(Id)
    );
    PRINT 'Created StarredFiles table.';
END
GO

-- Notifications
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Notifications]') AND type in (N'U'))
BEGIN
    CREATE TABLE Notifications (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        Title NVARCHAR(255) NOT NULL,
        Message NVARCHAR(MAX) NOT NULL,
        Type NVARCHAR(50) NOT NULL,
        ReferenceId INT NULL, -- Can point to TaskId etc.
        IsRead BIT DEFAULT 0,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (UserId) REFERENCES Users(Id)
    );
    PRINT 'Created Notifications table.';
END
GO

PRINT 'Migration completed successfully.';
