<?php
include_once '../config/db.php';

if(isset($_GET['id']) && isset($_GET['userId'])) {
    $fileId = $_GET['id'];
    $userId = $_GET['userId']; // Requesting User

    $sql = "SELECT FilePath, FileName, IsLocked, LockedByUserId FROM Files WHERE Id = ?";
    $stmt = sqlsrv_query($conn, $sql, array($fileId));

    if($stmt === false) {
        http_response_code(500);
        die("Database Error");
    }

    $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
    if(!$row) {
        http_response_code(404);
        die("File not found");
    }

    $filePath = $row['FilePath'];
    $fileName = $row['FileName'];
    $isLocked = $row['IsLocked'];
    $lockedBy = $row['LockedByUserId'];

    // Lock Check - REMOVED blocking for download as per user request.
    // if ($isLocked && $lockedBy != $userId) { ... }

    if(file_exists($filePath)) {
        $isInline = isset($_GET['inline']) && $_GET['inline'] === 'true';
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        header('Content-Description: File Transfer');
        
        // ALLOW IFRAME EMBEDDING
        header('X-Frame-Options: GOFORIT'); // Unstandard but sometimes used to disable
        header_remove('X-Frame-Options');
        header('Content-Security-Policy: frame-ancestors *');
        
        if ($isInline && ($ext === 'pdf' || in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp']))) {
            $contentType = $ext === 'pdf' ? 'application/pdf' : 'image/' . ($ext === 'jpg' ? 'jpeg' : $ext);
            header('Content-Type: ' . $contentType);
            header('Content-Disposition: inline; filename="'.basename($fileName).'"'); // Ensures browser tries to view it
        } else {
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="'.basename($fileName).'"');
        }
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($filePath));
        readfile($filePath);
        exit;
    } else {
        http_response_code(404);
        die("Physical file not found.");
    }

} else {
    http_response_code(400);
    die("Missing ID or UserID");
}
?>
