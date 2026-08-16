USE FileManagerDB;
GO

-- =============================================
-- Comprehensive Master Migration Script
-- Covers: Base Schema, Hierarchy Columns, BoardSections, Master Tables, File Locks & Trash
-- =============================================

-- 1. Users Table Updates
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Users]') AND name = 'ParentUserId')
BEGIN
    ALTER TABLE Users ADD ParentUserId NVARCHAR(36) NULL;
    PRINT 'Added ParentUserId column to Users table.';
END
GO

-- 2. Files Table Updates
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Files]') AND name = 'FileSize')
BEGIN
    ALTER TABLE Files ADD FileSize BIGINT NULL;
    PRINT 'Added FileSize column to Files table.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Files]') AND name = 'IsLocked')
BEGIN
    ALTER TABLE Files ADD IsLocked BIT DEFAULT 0;
    PRINT 'Added IsLocked column to Files table.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Files]') AND name = 'LockedByUserId')
BEGIN
    ALTER TABLE Files ADD LockedByUserId INT NULL;
    PRINT 'Added LockedByUserId column to Files table.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Files]') AND name = 'LockedOn')
BEGIN
    ALTER TABLE Files ADD LockedOn DATETIME NULL;
    PRINT 'Added LockedOn column to Files table.';
END
GO

-- 3. Tasks Table & Hierarchy Updates
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Tasks]') AND type in (N'U'))
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
    PRINT 'Created Tasks table.';
END
ELSE
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Tasks]') AND name = 'ParentTaskId')
    BEGIN
        ALTER TABLE Tasks ADD ParentTaskId NVARCHAR(36) NULL;
        PRINT 'Added ParentTaskId column to Tasks table.';
    END
END
GO

-- 4. BoardSections Table & Default Seeds
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[BoardSections]') AND type in (N'U'))
BEGIN
    CREATE TABLE BoardSections (
        Id NVARCHAR(100) PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        Color NVARCHAR(50) NOT NULL DEFAULT 'indigo',
        IsCustom BIT NOT NULL DEFAULT 0,
        IsCompletedSection BIT NOT NULL DEFAULT 0,
        SortOrder INT NOT NULL DEFAULT 0
    );
    PRINT 'Created BoardSections table.';
END
GO

IF NOT EXISTS (SELECT * FROM BoardSections WHERE Id = 'Pending')
BEGIN
    INSERT INTO BoardSections (Id, Name, Color, IsCustom, IsCompletedSection, SortOrder) VALUES ('Pending', 'To Do', 'gray', 0, 0, 1);
END
IF NOT EXISTS (SELECT * FROM BoardSections WHERE Id = 'In Progress')
BEGIN
    INSERT INTO BoardSections (Id, Name, Color, IsCustom, IsCompletedSection, SortOrder) VALUES ('In Progress', 'In Progress', 'blue', 0, 0, 2);
END
IF NOT EXISTS (SELECT * FROM BoardSections WHERE Id = 'Review')
BEGIN
    INSERT INTO BoardSections (Id, Name, Color, IsCustom, IsCompletedSection, SortOrder) VALUES ('Review', 'Review', 'purple', 0, 0, 3);
END
IF NOT EXISTS (SELECT * FROM BoardSections WHERE Id = 'Done')
BEGIN
    INSERT INTO BoardSections (Id, Name, Color, IsCustom, IsCompletedSection, SortOrder) VALUES ('Done', 'Done', 'green', 0, 1, 4);
END
GO

-- 5. TaskAssignments Table
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

-- 6. StarredFiles Table
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

-- 7. Notifications Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Notifications]') AND type in (N'U'))
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
    PRINT 'Created Notifications table.';
END
GO

-- 8. Master Tables (Countries, States, Districts, Talukas, Villages, Channels, Applications, ScopesOfWork, Clients)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Countries]') AND type in (N'U'))
BEGIN
    CREATE TABLE Countries (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(255) NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE()
    );
    INSERT INTO Countries (Name) VALUES ('India');
    PRINT 'Created Countries table.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[States]') AND type in (N'U'))
BEGIN
    CREATE TABLE States (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(255) NOT NULL,
        CountryId INT NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (CountryId) REFERENCES Countries(Id)
    );
    DECLARE @IndiaId INT = (SELECT Id FROM Countries WHERE Name = 'India');
    IF @IndiaId IS NOT NULL
        INSERT INTO States (Name, CountryId) VALUES ('Gujarat', @IndiaId);
    PRINT 'Created States table.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Districts]') AND type in (N'U'))
BEGIN
    CREATE TABLE Districts (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(255) NOT NULL,
        StateId INT NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (StateId) REFERENCES States(Id)
    );
    DECLARE @GujaratId INT = (SELECT Id FROM States WHERE Name = 'Gujarat');
    IF @GujaratId IS NOT NULL
        INSERT INTO Districts (Name, StateId) VALUES ('Default District', @GujaratId);
    PRINT 'Created Districts table.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Talukas]') AND type in (N'U'))
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
GO

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
GO

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
    PRINT 'Created Clients table.';
END
GO

PRINT 'Master migration completed successfully.';
