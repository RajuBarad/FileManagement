CREATE DATABASE FileManagerDB;
GO

USE FileManagerDB;
GO

CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Password NVARCHAR(255) NOT NULL, -- Will store hashed passwords
    Role NVARCHAR(20) NOT NULL DEFAULT 'User', -- 'Admin' or 'User'
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE Files (
    Id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    FileName NVARCHAR(255) NOT NULL,
    FilePath NVARCHAR(MAX) NOT NULL,
    OwnerId INT NOT NULL,
    IsShared BIT DEFAULT 0,
    ParentId UNIQUEIDENTIFIER NULL,
    IsFolder BIT DEFAULT 0,
    UploadDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (OwnerId) REFERENCES Users(Id)
);
GO

CREATE TABLE GenericShares (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    FileId UNIQUEIDENTIFIER NOT NULL,
    SharedWithUserId INT NULL, -- NULL could mean public or specific logic
    Permission NVARCHAR(50) DEFAULT 'Read',
    SharedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (FileId) REFERENCES Files(Id),
    FOREIGN KEY (SharedWithUserId) REFERENCES Users(Id)
);
GO

-- Insert default Admin
INSERT INTO Users (Username, Password, Role) VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin'); -- Password is 'password' (bcrypt)
GO
