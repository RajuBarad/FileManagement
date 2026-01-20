<?php
include_once 'config/db.php';

// 1. Find orphans count
$checkSql = "SELECT Count(*) as Cnt FROM Files WHERE ParentId IS NOT NULL AND ParentId NOT IN (SELECT Id FROM Files)";
$stmt = sqlsrv_query($conn, $checkSql);
$count = 0;
if($stmt && $row = sqlsrv_fetch_array($stmt)) {
    $count = $row['Cnt'];
}

echo "Found $count orphaned items.\n";

if ($count > 0) {
    // 2. Fix them by setting ParentId to NULL
    $fixSql = "UPDATE Files SET ParentId = NULL WHERE ParentId IS NOT NULL AND ParentId NOT IN (SELECT Id FROM Files)";
    $stmt = sqlsrv_query($conn, $fixSql);
    
    if($stmt) {
        $rows = sqlsrv_rows_affected($stmt);
        echo "Successfully moved $rows items to Home (Root).";
    } else {
        echo "Error Fixing: ";
        print_r(sqlsrv_errors());
    }
} else {
    echo "Nothing to fix.";
}
?>
