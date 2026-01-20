<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->fileId) && isset($data->userId)) {
    $fileId = $data->fileId;
    // Check if user is Admin
    $userSql = "SELECT IsAdmin FROM Users WHERE Id = ?";
    $userStmt = sqlsrv_query($conn, $userSql, array($userId));
    
    if ($userStmt === false || !sqlsrv_fetch($userStmt)) {
         http_response_code(403);
         echo json_encode(array("message" => "Unauthorized."));
         exit;
    }
    
    $isAdmin = sqlsrv_get_field($userStmt, 0);
    
    // Only Admin can permanently delete
    // OR maybe users can delete their own? User Request was "only admin".
    if (!$isAdmin) {
         http_response_code(403);
         echo json_encode(array("message" => "Only admins can permanently delete files."));
         exit;
    }

    // Permanent Delete
    // Note: In a full system, we should also delete the physical file from disk using 'unlink()'.
    // Fetch path first
    $pathSql = "SELECT FilePath, IsFolder FROM Files WHERE Id = ?";
    $pathStmt = sqlsrv_query($conn, $pathSql, array($fileId));
    
    if($pathStmt && $row = sqlsrv_fetch_array($pathStmt)) {
        $filePath = $row['FilePath'];
        // TODO: Implement physical deletion if required. For now, DB only.
    }

    $sql = "DELETE FROM Files WHERE Id = ? AND OwnerId = ?";
    $params = array($fileId, $userId);

    if(sqlsrv_query($conn, $sql, $params)) {
        echo json_encode(array("message" => "File permanently deleted."));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Failed to delete file."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
