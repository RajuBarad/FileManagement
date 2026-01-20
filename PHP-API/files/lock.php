<?php
include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->fileId) && isset($data->userId)) {
    $fileId = $data->fileId;
    $userId = $data->userId;

    // Check current lock status
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

    if($isLocked) {
        if($lockedBy == $userId) {
             // Already locked by same user, return success
             http_response_code(200);
             echo json_encode(array("message" => "File already locked by you."));
        } else {
             // Locked by someone else
             http_response_code(409); // Conflict
             
             // Get locker name
             $userSql = "SELECT Username FROM Users WHERE Id = ?";
             $userStmt = sqlsrv_query($conn, $userSql, array($lockedBy));
             $lockerName = "Unknown";
             if($userRow = sqlsrv_fetch_array($userStmt, SQLSRV_FETCH_ASSOC)) {
                 $lockerName = $userRow['Username'];
             }
             
             echo json_encode(array("message" => "File is currently locked by " . $lockerName));
        }
        exit;
    }

    // Lock the file
    $lockSql = "UPDATE Files SET IsLocked = 1, LockedByUserId = ?, LockedOn = GETDATE() WHERE Id = ?";
    $lockStmt = sqlsrv_query($conn, $lockSql, array($userId, $fileId));

    if($lockStmt) {
        file_put_contents("../php_lock_debug.log", date('Y-m-d H:i:s') . " - Locked File $fileId by User $userId\n", FILE_APPEND);
        http_response_code(200);
        echo json_encode(array("message" => "File locked successfully."));
    } else {
        file_put_contents("../php_lock_debug.log", date('Y-m-d H:i:s') . " - Lock Failed DB Error: " . print_r(sqlsrv_errors(), true) . "\n", FILE_APPEND);
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }

} else {
    http_response_code(400);
    echo json_encode(array("message" => "Missing fileId or userId."));
}
?>
