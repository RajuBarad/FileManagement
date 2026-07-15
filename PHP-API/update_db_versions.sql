USE FileManagerDB;
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[FileVersions]') AND type in (N'U'))
BEGIN
    CREATE TABLE FileVersions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        FileId UNIQUEIDENTIFIER NOT NULL,
        VersionNumber INT NOT NULL,
        FilePath NVARCHAR(MAX) NOT NULL,
        FileName NVARCHAR(255) NOT NULL,
        FileSize BIGINT NULL,
        UploadedByUserId INT NOT NULL,
        UploadedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (FileId) REFERENCES Files(Id) ON DELETE CASCADE,
        FOREIGN KEY (UploadedByUserId) REFERENCES Users(Id)
    );
    PRINT 'Created FileVersions table.';
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[UnlockRequests]') AND type in (N'U'))
BEGIN
    CREATE TABLE UnlockRequests (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        FileId UNIQUEIDENTIFIER NOT NULL,
        RequesterUserId INT NOT NULL,
        RequestedAt DATETIME DEFAULT GETDATE(),
        IsFulfilled BIT DEFAULT 0,
        FOREIGN KEY (FileId) REFERENCES Files(Id) ON DELETE CASCADE,
        FOREIGN KEY (RequesterUserId) REFERENCES Users(Id)
    );
    PRINT 'Created UnlockRequests table.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Notifications]') AND type in (N'U'))
BEGIN
    CREATE TABLE Notifications (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        Message NVARCHAR(255) NOT NULL,
        IsRead BIT DEFAULT 0,
        Type NVARCHAR(50) DEFAULT 'Info', -- 'Info', 'UnlockAlert', 'Share'
        RelatedId UNIQUEIDENTIFIER NULL, -- FileId etc.
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (UserId) REFERENCES Users(Id)
    );
    PRINT 'Created Notifications table.';
END
ELSE
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Notifications]') AND name = 'RelatedId')
    BEGIN
        ALTER TABLE Notifications ADD RelatedId UNIQUEIDENTIFIER NULL;
        PRINT 'Added RelatedId column to Notifications table.';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Notifications]') AND name = 'Type')
    BEGIN
        ALTER TABLE Notifications ADD Type NVARCHAR(50) DEFAULT 'Info';
        PRINT 'Added Type column to Notifications table.';
    END
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Channels]') AND name = 'IsDefault')
BEGIN
    ALTER TABLE Channels ADD IsDefault BIT DEFAULT 0 NOT NULL;
    PRINT 'Added IsDefault column to Channels table.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Channels]') AND name = 'Sequence')
BEGIN
    ALTER TABLE Channels ADD Sequence INT DEFAULT 0 NOT NULL;
    PRINT 'Added Sequence column to Channels table.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Applications]') AND name = 'ChannelId')
BEGIN
    ALTER TABLE Applications ADD ChannelId INT NULL;
    ALTER TABLE Applications ADD CONSTRAINT FK_Applications_Channels FOREIGN KEY (ChannelId) REFERENCES Channels(Id) ON DELETE SET NULL;
    PRINT 'Added ChannelId column to Applications table.';
END
GO

-- Update existing Applications to use the default channel if none is set
DECLARE @DefaultChId INT = (SELECT TOP 1 Id FROM Channels WHERE IsDefault = 1);
IF @DefaultChId IS NOT NULL
BEGIN
    UPDATE Applications SET ChannelId = @DefaultChId WHERE ChannelId IS NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[ApplicationAssignments]') AND type in (N'U'))
BEGIN
    CREATE TABLE ApplicationAssignments (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ApplicationId INT NOT NULL,
        UserId INT NOT NULL,
        AssignedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (ApplicationId) REFERENCES Applications(Id) ON DELETE CASCADE,
        FOREIGN KEY (UserId) REFERENCES Users(Id)
    );
    PRINT 'Created ApplicationAssignments table.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[ApplicationComments]') AND type in (N'U'))
BEGIN
    CREATE TABLE ApplicationComments (
        Id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        ApplicationId INT NOT NULL,
        UserId INT NOT NULL,
        Content NVARCHAR(MAX),
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (ApplicationId) REFERENCES Applications(Id) ON DELETE CASCADE,
        FOREIGN KEY (UserId) REFERENCES Users(Id)
    );
    PRINT 'Created ApplicationComments table.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[ApplicationAttachments]') AND type in (N'U'))
BEGIN
    CREATE TABLE ApplicationAttachments (
        Id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        ApplicationId INT NOT NULL,
        FileId UNIQUEIDENTIFIER NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (ApplicationId) REFERENCES Applications(Id) ON DELETE CASCADE,
        FOREIGN KEY (FileId) REFERENCES Files(Id) ON DELETE CASCADE
    );
    PRINT 'Created ApplicationAttachments table.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Followups]') AND type in (N'U'))
BEGIN
    CREATE TABLE Followups (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(255) NOT NULL,
        ReminderDays INT NOT NULL DEFAULT 1,
        IsDefault BIT DEFAULT 0,
        Sequence INT NOT NULL DEFAULT 0,
        CreatedAt DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created Followups table.';
END
GO

IF NOT EXISTS (SELECT * FROM Followups)
BEGIN
    INSERT INTO Followups (Name, ReminderDays, IsDefault, Sequence)
    VALUES ('Pending', 1, 1, 1),
           ('Call Back', 3, 0, 2),
           ('Meeting Scheduled', 7, 0, 3),
           ('Completed', 0, 0, 4);
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Applications]') AND name = 'FollowupId')
BEGIN
    ALTER TABLE Applications ADD FollowupId INT NULL;
    PRINT 'Added FollowupId to Applications table.';
END
GO

DECLARE @DefaultFollowupId INT;
SELECT TOP 1 @DefaultFollowupId = Id FROM Followups WHERE IsDefault = 1;
IF @DefaultFollowupId IS NULL
BEGIN
    SELECT TOP 1 @DefaultFollowupId = Id FROM Followups ORDER BY Sequence ASC;
END

IF @DefaultFollowupId IS NOT NULL
BEGIN
    DECLARE @Sql NVARCHAR(MAX) = 'UPDATE Applications SET FollowupId = ' + CAST(@DefaultFollowupId AS NVARCHAR(10)) + ' WHERE FollowupId IS NULL';
    EXEC sp_executesql @Sql;
END
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Applications_Followups')
BEGIN
    ALTER TABLE Applications ADD CONSTRAINT FK_Applications_Followups FOREIGN KEY (FollowupId) REFERENCES Followups(Id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Followups]') AND name = 'IsCompleted')
BEGIN
    ALTER TABLE Followups ADD IsCompleted BIT NOT NULL DEFAULT 0;
    PRINT 'Added IsCompleted to Followups table.';
END
GO

UPDATE Followups SET IsCompleted = 1 WHERE Name = 'Completed';
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Applications]') AND name = 'IsClosed')
BEGIN
    ALTER TABLE Applications ADD IsClosed BIT NOT NULL DEFAULT 0;
    PRINT 'Added IsClosed column to Applications table.';
END
GO


