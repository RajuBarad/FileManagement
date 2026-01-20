<?php
// Helper function to create notifications
// Assumes $conn is available globally or passed
function createNotification($conn, $userId, $title, $message, $type, $referenceId) {
    $sql = "INSERT INTO Notifications (UserId, Title, Message, Type, ReferenceId, IsRead, CreatedAt) VALUES (?, ?, ?, ?, ?, 0, GETDATE())";
    $params = array($userId, $title, $message, $type, $referenceId);
    $stmt = sqlsrv_query($conn, $sql, $params);
    if($stmt === false) {
        // Log error
         error_log(print_r(sqlsrv_errors(), true));
    }
}
?>
