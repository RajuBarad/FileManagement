<?php
include_once '../config/db.php';

// Backfill CompletedAt for Done tasks where it is NULL
// Use UpdatedAt if available, otherwise UpdatedAt (which should be set), otherwise GETDATE()
$sql = "UPDATE Tasks 
        SET CompletedAt = COALESCE(UpdatedAt, GETDATE()) 
        WHERE Status = 'Done' AND CompletedAt IS NULL";

if(sqlsrv_query($conn, $sql)) {
    echo "Backfill successful.";
} else {
    print_r(sqlsrv_errors());
}

// Also fix any tasks with NULL Status if my bug caused that
$sqlFixStatus = "UPDATE Tasks SET Status = 'Pending' WHERE Status IS NULL";
sqlsrv_query($conn, $sqlFixStatus);
?>
