<?php
include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->fileId) && isset($data->userId)) {
    $fileId = $data->fileId;
    $userId = $data->userId;

    // Check lock status and permissions
    $checkSql = "SELECT IsLocked, LockedByUserId FROM Files WHERE Id = ?";
    $stmt = sqlsrv_query($conn, $checkSql, array($fileId));
    
    if($stmt === false) {
         http_response_code(500);
         die(json_encode(array("error" => sqlsrv_errors())));
    }

    $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
    if(!$row) {
        http_response_code(404);
        echo json_encode(array("message" => "File not found."));
        exit;
    }

    $isLocked = $row['IsLocked'];
    $lockedBy = $row['LockedByUserId'];

    if(!$isLocked) {
        http_response_code(200);
        echo json_encode(array("message" => "File is not locked."));
        exit;
    }

    // Check if user is owner of lock OR Admin
    // Get Requesting User Role
    $roleSql = "SELECT Role FROM Users WHERE Id = ?";
    $roleStmt = sqlsrv_query($conn, $roleSql, array($userId));
    $userRole = 'User';
    if($roleRow = sqlsrv_fetch_array($roleStmt, SQLSRV_FETCH_ASSOC)) {
        $userRole = $roleRow['Role'];
    }

    if($lockedBy != $userId && strtolower($userRole) !== 'admin') {
         http_response_code(403);
         echo json_encode(array("message" => "You do not have permission to unlock this file."));
         exit;
    }

    // Unlock the file
    $unlockSql = "UPDATE Files SET IsLocked = 0, LockedByUserId = NULL, LockedOn = NULL WHERE Id = ?";
    $unlockStmt = sqlsrv_query($conn, $unlockSql, array($fileId));

    if($unlockStmt) {
        // --- NOTIFICATION LOGIC ---
        // Find users who requested to be notified
        $reqSql = "SELECT Id, RequesterUserId FROM UnlockRequests WHERE FileId = ? AND IsFulfilled = 0";
        $reqStmt = sqlsrv_query($conn, $reqSql, array($fileId));
        
        if ($reqStmt) {
            while ($reqRow = sqlsrv_fetch_array($reqStmt, SQLSRV_FETCH_ASSOC)) {
                $reqId = $reqRow['Id'];
                $requesterId = $reqRow['RequesterUserId'];

                // Create Notification
                // Get filename for nice message
                $fnameSql = "SELECT FileName FROM Files WHERE Id = ?";
                $fnameStmt = sqlsrv_query($conn, $fnameSql, array($fileId));
                $fname = "Unknown File";
                if ($fnRow = sqlsrv_fetch_array($fnameStmt)) {
                    $fname = $fnRow['FileName'];
                }

                $msg = "File '$fname' is now unlocked and available for editing.";
                $notifSql = "INSERT INTO Notifications (UserId, Message, Type, RelatedId) VALUES (?, ?, 'UnlockAlert', ?)";
                sqlsrv_query($conn, $notifSql, array($requesterId, $msg, $fileId));

                // Mark Request as Fulfilled
                $updateReqSql = "UPDATE UnlockRequests SET IsFulfilled = 1 WHERE Id = ?";
                sqlsrv_query($conn, $updateReqSql, array($reqId));
            }
        }
        // --- END NOTIFICATION LOGIC ---

        http_response_code(200);
        echo json_encode(array("message" => "File unlocked successfully."));
    } else {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }

} else {
    http_response_code(400);
    echo json_encode(array("message" => "Missing fileId or userId."));
}
?>
