<?php
include_once 'config/db.php';

// Function to add column if not exists
function addColumn($conn, $table, $column, $type) {
    $checkSql = "SELECT COL_LENGTH(?, ?) AS ColLength";
    $params = array($table, $column);
    $stmt = sqlsrv_query($conn, $checkSql, $params);
    
    if ($stmt && sqlsrv_fetch_array($stmt)) {
        echo "Column '$column' already exists in '$table'.<br>";
    } else {
        $alterSql = "ALTER TABLE $table ADD $column $type";
        if (sqlsrv_query($conn, $alterSql)) {
            echo "Added column '$column' to '$table'.<br>";
        } else {
            echo "Failed to add column '$column': ";
            print_r(sqlsrv_errors());
            echo "<br>";
        }
    }
}

echo "Updating Database Schema for Trash & Recent...<br>";

// Add IsDeleted
addColumn($conn, "Files", "IsDeleted", "BIT DEFAULT 0");

// Add DeletedAt
addColumn($conn, "Files", "DeletedAt", "DATETIME NULL");

// Add LastModified (default to GETDATE for new files, and maybe update old ones)
addColumn($conn, "Files", "LastModified", "DATETIME DEFAULT GETDATE()");

// Update existing records to have LastModified = UploadDate if null
$updateSql = "UPDATE Files SET LastModified = UploadDate WHERE LastModified IS NULL";
if (sqlsrv_query($conn, $updateSql)) {
    echo "Updated LastModified for existing files.<br>";
}

// Update existing records IsDeleted = 0 if null (though default handles new inserts)
$updateDelSql = "UPDATE Files SET IsDeleted = 0 WHERE IsDeleted IS NULL";
if (sqlsrv_query($conn, $updateDelSql)) {
    echo "Updated IsDeleted for existing files.<br>";
}

echo "Done.";
?>
