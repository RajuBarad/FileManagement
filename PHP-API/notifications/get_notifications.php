<?php
include_once '../config/db.php';

if(isset($_GET['userId'])) {
    $userId = $_GET['userId'];

    // Dynamically generate Task Reminders for this user
    // 1. Reminders for tasks due tomorrow (1 day before)
    $remSql1 = "SELECT a.Id, a.VisitorName, a.VisitingDate
                FROM Applications a
                JOIN ApplicationAssignments aa ON a.Id = aa.ApplicationId
                LEFT JOIN Followups f ON a.FollowupId = f.Id
                WHERE aa.UserId = ? 
                  AND (f.IsCompleted = 0 OR f.IsCompleted IS NULL)
                  AND (a.IsClosed = 0 OR a.IsClosed IS NULL)
                  AND DATEDIFF(day, GETDATE(), a.VisitingDate) = 1";
    $remStmt1 = sqlsrv_query($conn, $remSql1, array($userId));
    if($remStmt1 !== false) {
        while($row = sqlsrv_fetch_array($remStmt1, SQLSRV_FETCH_ASSOC)) {
            $appId = $row['Id'];
            $visitorName = $row['VisitorName'];
            // Check if notification already exists
            $checkSql = "SELECT 1 FROM Notifications WHERE UserId = ? AND Type = 'TaskReminderTomorrow' AND ReferenceId = ?";
            $checkStmt = sqlsrv_query($conn, $checkSql, array($userId, $appId));
            if($checkStmt !== false && sqlsrv_has_rows($checkStmt) === false) {
                // Create notification
                $insSql = "INSERT INTO Notifications (UserId, Title, Message, Type, ReferenceId, IsRead, CreatedAt) 
                           VALUES (?, ?, ?, 'TaskReminderTomorrow', ?, 0, GETDATE())";
                $msg = "Task for visitor " . $visitorName . " is due tomorrow.";
                sqlsrv_query($conn, $insSql, array($userId, "Task Due Tomorrow", $msg, $appId));
            }
        }
    }

    // 2. Reminders for tasks due today (0 days difference)
    $remSql2 = "SELECT a.Id, a.VisitorName, a.VisitingDate
                FROM Applications a
                JOIN ApplicationAssignments aa ON a.Id = aa.ApplicationId
                LEFT JOIN Followups f ON a.FollowupId = f.Id
                WHERE aa.UserId = ? 
                  AND (f.IsCompleted = 0 OR f.IsCompleted IS NULL)
                  AND (a.IsClosed = 0 OR a.IsClosed IS NULL)
                  AND DATEDIFF(day, GETDATE(), a.VisitingDate) = 0";
    $remStmt2 = sqlsrv_query($conn, $remSql2, array($userId));
    if($remStmt2 !== false) {
        while($row = sqlsrv_fetch_array($remStmt2, SQLSRV_FETCH_ASSOC)) {
            $appId = $row['Id'];
            $visitorName = $row['VisitorName'];
            // Check if notification already exists
            $checkSql = "SELECT 1 FROM Notifications WHERE UserId = ? AND Type = 'TaskReminderToday' AND ReferenceId = ?";
            $checkStmt = sqlsrv_query($conn, $checkSql, array($userId, $appId));
            if($checkStmt !== false && sqlsrv_has_rows($checkStmt) === false) {
                // Create notification
                $insSql = "INSERT INTO Notifications (UserId, Title, Message, Type, ReferenceId, IsRead, CreatedAt) 
                           VALUES (?, ?, ?, 'TaskReminderToday', ?, 0, GETDATE())";
                $msg = "URGENT: Task for visitor " . $visitorName . " is due TODAY!";
                sqlsrv_query($conn, $insSql, array($userId, "Task Due Today", $msg, $appId));
            }
        }
    }

    $notifications = array();

    // 1. Get standard notifications
    $sql = "SELECT CAST(Id AS INT) as Id, Title, Message, Type, CAST(RelatedId AS NVARCHAR(36)) as RelatedId, ReferenceId, CreatedAt 
            FROM Notifications 
            WHERE UserId = ? AND IsRead = 0";
    
    $stmt = sqlsrv_query($conn, $sql, array($userId));
    if($stmt !== false) {
        while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $notifications[] = array(
                'id' => $row['Id'],
                'title' => isset($row['Title']) ? $row['Title'] : '',
                'message' => $row['Message'],
                'type' => $row['Type'],
                'relatedId' => $row['RelatedId'],
                'referenceId' => isset($row['ReferenceId']) ? (int)$row['ReferenceId'] : null,
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
