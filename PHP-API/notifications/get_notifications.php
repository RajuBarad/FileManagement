<?php
include_once '../config/db.php';

if(isset($_GET['userId'])) {
    $userId = $_GET['userId'];

    $notifications = array();

    // 1. Get standard notifications
    $sql = "SELECT CAST(Id AS INT) as Id, Message, Type, CAST(RelatedId AS NVARCHAR(36)) as RelatedId, CreatedAt 
            FROM Notifications 
            WHERE UserId = ? AND IsRead = 0";
    
    $stmt = sqlsrv_query($conn, $sql, array($userId));
    if($stmt !== false) {
        while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $notifications[] = array(
                'id' => $row['Id'],
                'message' => $row['Message'],
                'type' => $row['Type'],
                'relatedId' => $row['RelatedId'],
                'createdAt' => $row['CreatedAt'],
                'source' => 'notification'
            );
        }
    }

    // 2. Get pending unlock requests (as 'notifications')
    // We need to join with Files to get the filename
    $reqSql = "SELECT R.Id, F.Name as FileName, R.FileId, R.RequestedAt 
               FROM UnlockRequests R
               JOIN FileManagement.dbo.Files F ON R.FileId = F.Id
               WHERE R.RequesterUserId = ? AND R.IsFulfilled = 0";

    // Note: Assuming table name is Files. Usually it is just Files if in default schema.
    // If schema issue, try just Files.
    // However, simple JOIN Files F ON ... 
    
    // 2. Get pending unlock requests (as 'notifications')
    // We need to join with Files to get the filename and ParentId
    // AND join with GenericShares to see if it is shared with the requester
    $reqSql = "SELECT R.Id, F.FileName, CAST(R.FileId AS NVARCHAR(36)) as FileId, R.RequestedAt, CAST(F.ParentId AS NVARCHAR(36)) as ParentId,
                      CASE WHEN gs.Id IS NOT NULL THEN 1 ELSE 0 END as IsSharedWithMe
               FROM UnlockRequests R
               JOIN Files F ON R.FileId = F.Id
               LEFT JOIN GenericShares gs ON F.Id = gs.FileId AND gs.SharedWithUserId = R.RequesterUserId
               WHERE R.RequesterUserId = ? AND R.IsFulfilled = 0 AND (R.IsNotificationDismissed = 0 OR R.IsNotificationDismissed IS NULL)";

    $reqStmt = sqlsrv_query($conn, $reqSql, array($userId));
    if($reqStmt !== false) {
        while($row = sqlsrv_fetch_array($reqStmt, SQLSRV_FETCH_ASSOC)) {
            
            $pId = $row['ParentId'];
            if ($row['IsSharedWithMe'] == 1) {
                $pId = 'shared';
            }

            $notifications[] = array(
                'id' => 'req_' . $row['Id'], // Unique ID distinction
                'message' => "Waiting for '" . $row['FileName'] . "' to be unlocked",
                'type' => 'PendingUnlockRequest',
                'relatedId' => $row['FileId'],
                'parentId' => $pId,
                'createdAt' => $row['RequestedAt'],
                'source' => 'request'
            );
        }
    }

    // Helper to format date
    function formatDate($date) {
        if ($date instanceof DateTime) {
            return $date->format('Y-m-d H:i:s');
        }
        return $date; // Assuming it's already a string or null
    }

    $notifications = array_map(function($n) {
        $n['createdAt'] = formatDate($n['createdAt']);
        return $n;
    }, $notifications);

    // Sort by CreatedAt DESC
    usort($notifications, function($a, $b) {
        return strtotime($b['createdAt']) - strtotime($a['createdAt']);
    });

    echo json_encode($notifications);
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Missing userId."));
}
?>
