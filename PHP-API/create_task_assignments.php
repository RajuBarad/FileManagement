<?php
include_once 'config/db.php';

// 1. Create TaskAssignments Table
$createTableSql = "
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TaskAssignments' AND xtype='U')
BEGIN
    CREATE TABLE TaskAssignments (
        Id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        TaskId UNIQUEIDENTIFIER NOT NULL,
        UserId INT NOT NULL,
        FOREIGN KEY (TaskId) REFERENCES Tasks(Id) ON DELETE CASCADE,
        FOREIGN KEY (UserId) REFERENCES Users(Id)
    );
    PRINT 'TaskAssignments table created.';
END
";
sqlsrv_query($conn, $createTableSql);

// 2. Migrate existing data (Idempotent: ignore duplicates)
$migrateSql = "
INSERT INTO TaskAssignments (TaskId, UserId)
SELECT t.Id, t.AssignedToUserId
FROM Tasks t
WHERE t.AssignedToUserId IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM TaskAssignments ta 
      WHERE ta.TaskId = t.Id AND ta.UserId = t.AssignedToUserId
  );
";
$stmt = sqlsrv_query($conn, $migrateSql);
if($stmt) {
    echo "Migration completed. Rows affected: " . sqlsrv_rows_affected($stmt);
} else {
    echo "Migration error: ";
    print_r(sqlsrv_errors());
}

// Note: We are keeping AssignedToUserId in Tasks for now as legacy/primary but will primarily read from TaskAssignments
?>
