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

-- Countries
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Countries]') AND type in (N'U'))
BEGIN
    CREATE TABLE Countries (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(255) NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created Countries table.';
    INSERT INTO Countries (Name) VALUES ('India');
END
GO

-- States
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[States]') AND type in (N'U'))
BEGIN
    CREATE TABLE States (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(255) NOT NULL,
        CountryId INT NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (CountryId) REFERENCES Countries(Id)
    );
    PRINT 'Created States table.';
    DECLARE @IndiaId INT = (SELECT Id FROM Countries WHERE Name = 'India');
    IF @IndiaId IS NOT NULL
        INSERT INTO States (Name, CountryId) VALUES ('Gujarat', @IndiaId);
END
GO

-- Districts
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Districts]') AND type in (N'U'))
BEGIN
    CREATE TABLE Districts (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(255) NOT NULL,
        StateId INT NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (StateId) REFERENCES States(Id)
    );
    PRINT 'Created Districts table.';
    DECLARE @GujaratId INT = (SELECT Id FROM States WHERE Name = 'Gujarat');
    IF @GujaratId IS NOT NULL
        INSERT INTO Districts (Name, StateId) VALUES ('Default District', @GujaratId);
END
GO

-- Talukas (Previously Tehsils)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Talukas]') AND type in (N'U'))
BEGIN
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Tehsils]') AND type in (N'U'))
    BEGIN
        -- Rename existing table
        EXEC sp_rename 'Tehsils', 'Talukas';
        PRINT 'Renamed Tehsils to Talukas.';
        
        -- Add DistrictId column
        ALTER TABLE Talukas ADD DistrictId INT NULL;
        
        -- Assign existing Talukas to Default District
        DECLARE @DefaultDistrictId INT = (SELECT Id FROM Districts WHERE Name = 'Default District');
        IF @DefaultDistrictId IS NOT NULL
            UPDATE Talukas SET DistrictId = @DefaultDistrictId;
            
        -- Make DistrictId NOT NULL after update
        ALTER TABLE Talukas ALTER COLUMN DistrictId INT NOT NULL;
        ALTER TABLE Talukas ADD CONSTRAINT FK_Taluka_District FOREIGN KEY (DistrictId) REFERENCES Districts(Id);
    END
    ELSE
    BEGIN
        CREATE TABLE Talukas (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            Name NVARCHAR(255) NOT NULL,
            DistrictId INT NOT NULL,
            CreatedAt DATETIME DEFAULT GETDATE(),
            FOREIGN KEY (DistrictId) REFERENCES Districts(Id)
        );
        PRINT 'Created Talukas table.';
    END
END
GO

-- Villages
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Villages]') AND type in (N'U'))
BEGIN
    CREATE TABLE Villages (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(255) NOT NULL,
        TalukaId INT NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (TalukaId) REFERENCES Talukas(Id)
    );
    PRINT 'Created Villages table.';
END
ELSE
BEGIN
    -- Check if TehsilId exists and rename it to TalukaId
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Villages]') AND name = 'TehsilId')
    BEGIN
        -- Drop foreign key first if it exists
        DECLARE @ConstraintName NVARCHAR(255) = (SELECT name FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('Villages') AND referenced_object_id = OBJECT_ID('Talukas'));
        IF @ConstraintName IS NOT NULL
            EXEC('ALTER TABLE Villages DROP CONSTRAINT ' + @ConstraintName);

        EXEC sp_rename 'Villages.TehsilId', 'TalukaId', 'COLUMN';
        PRINT 'Renamed TehsilId to TalukaId in Villages table.';
        
        -- Add updated foreign key
        ALTER TABLE Villages ADD CONSTRAINT FK_Village_Taluka FOREIGN KEY (TalukaId) REFERENCES Talukas(Id);
    END
END
GO

-- Channels
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Channels]') AND type in (N'U'))
BEGIN
    CREATE TABLE Channels (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(255) NOT NULL,
        ReminderDays INT DEFAULT 0,
        CreatedAt DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created Channels table.';
END
GO

-- Applications
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Applications]') AND type in (N'U'))
BEGIN
    CREATE TABLE Applications (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        VisitingDate DATE NOT NULL,
        VisitorName NVARCHAR(255) NOT NULL,
        MobileNo NVARCHAR(20) NULL,
        VillageId INT NOT NULL,
        Description NVARCHAR(MAX) NULL,
        Reference NVARCHAR(MAX) NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (VillageId) REFERENCES Villages(Id)
    );
    PRINT 'Created Applications table.';
END
GO

-- Scopes of Work
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[ScopesOfWork]') AND type in (N'U'))
BEGIN
    CREATE TABLE ScopesOfWork (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(255) NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created ScopesOfWork table.';
END
GO

-- Clients
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Clients]') AND type in (N'U'))
BEGIN
    CREATE TABLE Clients (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(255) NOT NULL,
        MobileNo NVARCHAR(20) NULL,
        Email NVARCHAR(255) NULL,
        Address NVARCHAR(MAX) NULL,
        VillageId INT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (VillageId) REFERENCES Villages(Id)
    );
    PRINT 'Created Clients table with VillageId.';
END
ELSE
BEGIN
    -- Add VillageId if not exists
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Clients]') AND name = 'VillageId')
    BEGIN
        ALTER TABLE Clients ADD VillageId INT NULL;
        ALTER TABLE Clients ADD CONSTRAINT FK_Client_Village FOREIGN KEY (VillageId) REFERENCES Villages(Id);
        PRINT 'Added VillageId column to Clients table.';
    END
END
GO

PRINT 'Migration completed successfully.';
