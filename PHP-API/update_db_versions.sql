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
