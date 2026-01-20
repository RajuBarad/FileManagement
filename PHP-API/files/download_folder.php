<?php
include_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

$folderId = isset($_GET['folderId']) ? $_GET['folderId'] : null;

if (!$folderId) {
    http_response_code(400);
    echo json_encode(["message" => "Folder ID is required"]);
    exit;
}

// 1. Get Folder Name for the zip filename
$sql = "SELECT FileName FROM Files WHERE Id = ?";
$stmt = sqlsrv_query($conn, $sql, array($folderId));
if ($stmt === false || !sqlsrv_has_rows($stmt)) {
    http_response_code(404);
    echo json_encode(["message" => "Folder not found"]);
    exit;
}
$row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
$rootFolderName = $row['FileName'];

// 2. Prepare Zip Archive
$zip = new ZipArchive();
$zipName = tempnam(sys_get_temp_dir(), "zip");
if ($zip->open($zipName, ZipArchive::CREATE) !== TRUE) {
    http_response_code(500);
    echo json_encode(["message" => "Could not open zip archive"]);
    exit;
}

// 3. Recursive function to add files
function addFolderToZip($conn, $parentId, $zip, $parentPath) {
    $sql = "SELECT Id, FileName, FilePath, IsFolder FROM Files WHERE ParentId = ?";
    $stmt = sqlsrv_query($conn, $sql, array($parentId));
    
    if ($stmt === false) return;

    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $currentPath = $parentPath . '/' . $row['FileName'];
        
        if ($row['IsFolder']) {
            $zip->addEmptyDir($currentPath);
            addFolderToZip($conn, $row['Id'], $zip, $currentPath);
        } else {
            // It's a file
            $filePath = $row['FilePath'];
            if (file_exists($filePath)) {
                $zip->addFile($filePath, $currentPath);
            }
        }
    }
}

// Start recursion
addFolderToZip($conn, $folderId, $zip, $rootFolderName);

$zip->close();

// 4. Serve the file
if (file_exists($zipName)) {
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $rootFolderName . '.zip"');
    header('Content-Length: ' . filesize($zipName));
    readfile($zipName);
    unlink($zipName); // Delete temp file
} else {
    http_response_code(500);
    echo json_encode(["message" => "Failed to create zip file"]);
}
?>
