<?php
include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->fileId) && isset($data->sharedWithUserId) && isset($data->permission)) {
    $fileId = $data->fileId;
    $sharedWithUserId = $data->sharedWithUserId;
    $permission = $data->permission;

    // Check if share already exists to avoid duplicates
    $checkSql = "SELECT Id FROM GenericShares WHERE FileId = ? AND SharedWithUserId = ?";
    $checkStmt = sqlsrv_query($conn, $checkSql, array($fileId, $sharedWithUserId));
    
    if($checkStmt && sqlsrv_has_rows($checkStmt)) {
        // Already shared
        http_response_code(200);
        echo json_encode(array("message" => "File already shared with this user."));
        exit;
    }

    // Insert new share
    $sql = "INSERT INTO GenericShares (FileId, SharedWithUserId, Permission) VALUES (?, ?, ?)";
    $params = array($fileId, $sharedWithUserId, $permission);
    
    $stmt = sqlsrv_query($conn, $sql, $params);
    
    if($stmt) {
        // Update IsShared flag on file
        $sqlUpdate = "UPDATE Files SET IsShared = 1 WHERE Id = ?";
        sqlsrv_query($conn, $sqlUpdate, array($fileId));

        // NOTIFICATION LOGIC
        // NOTIFICATION LOGIC
        include_once '../notifications/helper.php';
        $fSql = "SELECT FileName, IsFolder FROM Files WHERE Id = ?";
        $fStmt = sqlsrv_query($conn, $fSql, array($fileId));
        if($fStmt && $fRow = sqlsrv_fetch_array($fStmt)) {
            $fileName = $fRow['FileName'];
            $isFolder = $fRow['IsFolder'];
            
            $type = $isFolder ? 'FolderShare' : 'FileShare';
            $msgType = $isFolder ? 'folder' : 'file';
            $msg = "A $msgType '$fileName' has been shared with you.";
            
            createNotification($conn, $sharedWithUserId, "New " . ucfirst($msgType) . " Shared", $msg, $type, $fileId);
            
            file_put_contents('../share_debug.log', date('Y-m-d H:i:s') . " - Notification sent to $sharedWithUserId for $msgType $fileId ($type)\n", FILE_APPEND);
        } else {
            file_put_contents('../share_debug.log', date('Y-m-d H:i:s') . " - Failed to fetch file name or file not found for notification. FileId: $fileId. Error: " . print_r(sqlsrv_errors(), true) . "\n", FILE_APPEND);
        }
        
        http_response_code(201);
        echo json_encode(array("message" => "File shared successfully."));
    } else {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
