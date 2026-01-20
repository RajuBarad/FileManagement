<?php
include_once '../config/db.php';

if(isset($_GET['userId'])) {
    $userId = $_GET['userId'];
    
    // Get unread count
    $sqlCount = "SELECT COUNT(*) as UnreadCount FROM Notifications WHERE UserId = ? AND IsRead = 0";
    $stmtCount = sqlsrv_query($conn, $sqlCount, array($userId));
    $unreadCount = 0;
    if($r = sqlsrv_fetch_array($stmtCount)) {
        $unreadCount = $r['UnreadCount'];
    }
    
    // Get latest 5 unread notifications
    $sqlLatest = "SELECT TOP 5 Id, Title, Message, Type, ReferenceId, CreatedAt FROM Notifications WHERE UserId = ? AND IsRead = 0 ORDER BY CreatedAt DESC";
    $stmtLatest = sqlsrv_query($conn, $sqlLatest, array($userId));
    
    $notifications = array();
    while($row = sqlsrv_fetch_array($stmtLatest, SQLSRV_FETCH_ASSOC)) {
        $notifications[] = array(
            'id' => $row['Id'],
            'title' => $row['Title'],
            'message' => $row['Message'],
            'type' => $row['Type'],
            'referenceId' => $row['ReferenceId'],
            'createdAt' => $row['CreatedAt']->format('Y-m-d H:i:s')
        );
    }
    
    echo json_encode(array('unreadCount' => $unreadCount, 'notifications' => $notifications));
} else {
    http_response_code(400);
}
?>
