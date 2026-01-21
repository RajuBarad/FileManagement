<?php
include_once '../config/db.php';

if($_SERVER['REQUEST_METHOD'] == 'POST') {
    file_put_contents("../php_upload_debug.log", date('Y-m-d H:i:s') . " - RAW POST REQ: " . print_r($_POST, true) . "\n", FILE_APPEND);

    // Parse JSON input immediately
    $jsonInput = file_get_contents("php://input");
    $data = json_decode($jsonInput, true);

    // Check for empty POST but large Content-Length (post_max_size violation)
    // We strictly check if POST, FILES, AND JSON DATA are all empty/null despite having content length
    if (empty($_POST) && empty($_FILES) && empty($data) && isset($_SERVER['CONTENT_LENGTH']) && $_SERVER['CONTENT_LENGTH'] > 0) {
        $postMaxSize = ini_get('post_max_size');
        file_put_contents("../php_upload_debug.log", "POST Size Violation. Content-Length: " . $_SERVER['CONTENT_LENGTH'] . ", post_max_size: " . $postMaxSize . "\n", FILE_APPEND);
        http_response_code(413); // Payload Too Large
        echo json_encode(array("message" => "File too large. Exceeds post_max_size ($postMaxSize)."));
        exit;
    }
    
    // Check if it's a folder creation request or file upload
    // $data is already parsed above
    
    if (isset($data['createFolder']) && $data['createFolder'] == true) {
        // Create Folder
        $name = $data['name'];
        $parentId = isset($data['parentId']) ? $data['parentId'] : null;
        $ownerId = $data['ownerId'];
        
        // Check for duplicate folder name
        $checkSql = "SELECT Id FROM Files WHERE FileName = ? AND OwnerId = ? AND IsFolder = 1 AND " . ($parentId === null ? "ParentId IS NULL" : "ParentId = ?");
        $checkParams = ($parentId === null) ? array($name, $ownerId) : array($name, $ownerId, $parentId);
        $checkStmt = sqlsrv_query($conn, $checkSql, $checkParams);
        
        if ($checkStmt && sqlsrv_has_rows($checkStmt)) {
            http_response_code(409); // Conflict
            echo json_encode(array("message" => "Folder with this name already exists."));
            exit;
        }
        
        $sql = "INSERT INTO Files (FileName, FilePath, OwnerId, ParentId, IsFolder) OUTPUT INSERTED.Id VALUES (?, '', ?, ?, 1)";
        $params = array($name, $ownerId, $parentId);
        
        $stmt = sqlsrv_query($conn, $sql, $params);
        if($stmt) {
             $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
             http_response_code(201);
             echo json_encode(array("message" => "Folder created.", "id" => $row['Id']));
        } else {
             http_response_code(500);
             echo json_encode(array("error" => sqlsrv_errors()));
        }
        exit;
    }

    // File Upload
    if(isset($_FILES['file']) && isset($_POST['ownerId'])) {
        $ownerId = $_POST['ownerId'];
        $parentId = isset($_POST['parentId']) && $_POST['parentId'] !== 'null' ? $_POST['parentId'] : null;
        $file = $_FILES['file'];
        
        file_put_contents("../php_upload_debug.log", date('Y-m-d H:i:s') . " - Upload Request for user " . $ownerId . "\n", FILE_APPEND);
        file_put_contents("../php_upload_debug.log", "POST Data: " . print_r($_POST, true) . "\n", FILE_APPEND);
        // file_put_contents("../php_upload_debug.log", print_r($_FILES, true), FILE_APPEND);

        $targetDir = "../uploads/";
        if(!is_dir($targetDir)) {
            mkdir($targetDir, 0777, true);
        }
        
        $fileName = basename($file["name"]);
        $targetFilePath = $targetDir . time() . "_" . $fileName; 
        
        if(move_uploaded_file($file["tmp_name"], $targetFilePath)) {
            $existingFileId = isset($_POST['existingFileId']) ? $_POST['existingFileId'] : null;
            
            if ($existingFileId) {
                // Check Lock Status
                $checkLockSql = "SELECT IsLocked, LockedByUserId FROM Files WHERE Id = ?";
                $checkLockStmt = sqlsrv_query($conn, $checkLockSql, array($existingFileId));
                if($checkLockStmt && $lockRow = sqlsrv_fetch_array($checkLockStmt, SQLSRV_FETCH_ASSOC)) {
                    if($lockRow['IsLocked'] && $lockRow['LockedByUserId'] != $ownerId) {
                         // Locked by someone else
                         unlink($targetFilePath); // Clean up uploaded temp file
                         http_response_code(409);
                         echo json_encode(array("message" => "File is locked by another user. Cannot overwrite."));
                         exit;
                    }
                }

                // Fetch old file path to archive
                $getOldSql = "SELECT FilePath, FileName, FileSize FROM Files WHERE Id = ? AND OwnerId = ?";
                $getOldStmt = sqlsrv_query($conn, $getOldSql, array($existingFileId, $ownerId));
                if($getOldStmt && $row = sqlsrv_fetch_array($getOldStmt, SQLSRV_FETCH_ASSOC)) {
                    if(file_exists($row['FilePath'])) {
                        // Create versions directory if not exists
                        $versionsDir = "../uploads/versions/";
                        if(!is_dir($versionsDir)) {
                            mkdir($versionsDir, 0777, true);
                        }

                        // Determine Version Number
                        $verSql = "SELECT MAX(VersionNumber) as MaxVer FROM FileVersions WHERE FileId = ?";
                        $verStmt = sqlsrv_query($conn, $verSql, array($existingFileId));
                        $maxVer = 0;
                        if($verStmt && $vRow = sqlsrv_fetch_array($verStmt, SQLSRV_FETCH_ASSOC)) {
                            $maxVer = $vRow['MaxVer'] ? $vRow['MaxVer'] : 0;
                        }
                        $newVer = $maxVer + 1;

                        // Archive Old File
                        $archivedName = $existingFileId . "_v" . $newVer . "_" . $row['FileName']; // Unique name
                        $archivedPath = $versionsDir . $archivedName;
                        
                        // Move or Copy? Copy is safer incase of failure, but Move saves space if we are overwriting anyway.
                        // Since we are replacing the main file content, we should MOVE the old content to archive path.
                        // ERROR: unique file names in uploads/. If we move, the main pointer is broken until we update.
                        // Safe bet: Copy old to archive, then overwrite main.
                        // Actually, rename() is fast.
                        if (rename($row['FilePath'], $archivedPath)) {
                            // Insert into FileVersions
                            $insertVerSql = "INSERT INTO FileVersions (FileId, VersionNumber, FilePath, FileName, FileSize, UploadedByUserId) VALUES (?, ?, ?, ?, ?, ?)";
                            $insertVerParams = array($existingFileId, $newVer, $archivedPath, $row['FileName'], $row['FileSize'], $ownerId);
                            sqlsrv_query($conn, $insertVerSql, $insertVerParams);
                        }
                    }
                }
                
                // Update existing record AND Unlock it (Auto-unlock feature)
                $size = filesize($targetFilePath);
                $sql = "UPDATE Files SET FilePath = ?, FileName = ?, FileSize = ?, UploadDate = GETDATE(), IsLocked = 0, LockedByUserId = NULL, LockedOn = NULL OUTPUT INSERTED.Id WHERE Id = ? AND OwnerId = ?";
                $params = array($targetFilePath, $fileName, $size, $existingFileId, $ownerId);
            } else {
                // Insert new record
                $finalParentId = $parentId;
                $size = filesize($targetFilePath);

                // Handle Relative Path (Folder Uploads)
                if (isset($_POST['relativePath']) && !empty($_POST['relativePath'])) {
                    $relPath = $_POST['relativePath']; // e.g., "FolderA/SubFolderB" (excluding filename)
                    $folders = explode('/', $relPath);
                    
                    foreach ($folders as $folderName) {
                        if (empty($folderName) || $folderName == ".") continue;

                        // Check if this folder exists under current parent
                        $checkSql = "SELECT Id FROM Files WHERE FileName = ? AND ParentId " . ($finalParentId ? "= ?" : "IS NULL") . " AND IsFolder = 1 AND OwnerId = ?";
                        $checkParams = $finalParentId ? array($folderName, $finalParentId, $ownerId) : array($folderName, $ownerId);
                        
                        $checkStmt = sqlsrv_query($conn, $checkSql, $checkParams);
                        
                        if ($checkStmt && sqlsrv_has_rows($checkStmt)) {
                            $row = sqlsrv_fetch_array($checkStmt, SQLSRV_FETCH_ASSOC);
                            $finalParentId = $row['Id'];
                        } else {
                            // Create folder
                            $createSql = "INSERT INTO Files (FileName, FilePath, OwnerId, ParentId, IsFolder, UploadDate) OUTPUT INSERTED.Id VALUES (?, '', ?, ?, 1, GETDATE())";
                            $createParams = array($folderName, $ownerId, $finalParentId);
                            $createStmt = sqlsrv_query($conn, $createSql, $createParams);
                            if ($createStmt) {
                                $row = sqlsrv_fetch_array($createStmt, SQLSRV_FETCH_ASSOC);
                                $finalParentId = $row['Id'];
                            }
                        }
                    }
                }

                $sql = "INSERT INTO Files (FileName, FilePath, FileSize, OwnerId, ParentId, IsFolder) OUTPUT INSERTED.Id VALUES (?, ?, ?, ?, ?, 0)";
                $params = array($fileName, $targetFilePath, $size, $ownerId, $finalParentId);
            }
            // $sql and $params are set, execute query

            $stmt = sqlsrv_query($conn, $sql, $params);
            
            if($stmt) {
                $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
                http_response_code(201);
                echo json_encode(array("message" => "File uploaded successfully.", "id" => $row['Id']));
            } else {
                http_response_code(500);
                file_put_contents("../php_upload_debug.log", "SQL Error: " . print_r(sqlsrv_errors(), true) . "\n", FILE_APPEND);
                echo json_encode(array("error" => sqlsrv_errors()));
            }
        } else {
             http_response_code(500);
             file_put_contents("../php_upload_debug.log", "Move Uploaded File Failed.\n", FILE_APPEND);
             echo json_encode(array("message" => "Sorry, there was an error uploading your file."));
        }
    } else {
        file_put_contents("../php_upload_debug.log", "Incomplete Data. POST: " . print_r($_POST, true) . " FILES: " . print_r($_FILES, true) . "\n", FILE_APPEND);
        http_response_code(400);
        echo json_encode(array("message" => "Incomplete data."));
    }
} else {
    http_response_code(405);
    echo json_encode(array("message" => "Method not allowed."));
}
?>
