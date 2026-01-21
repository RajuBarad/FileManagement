<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->versionId) && isset($data->userId)) {
    $versionId = $data->versionId;
    $userId = $data->userId;

    // 1. Get Details of the Version to Restore
    $vSql = "SELECT * FROM FileVersions WHERE Id = ?";
    $vStmt = sqlsrv_query($conn, $vSql, array($versionId));

    if ($vStmt && $vRow = sqlsrv_fetch_array($vStmt, SQLSRV_FETCH_ASSOC)) {
        $fileId = $vRow['FileId'];
        $historyFilePath = $vRow['FilePath'];
        $historyFileName = $vRow['FileName'];
        $historyFileSize = $vRow['FileSize'];

        // 2. Archive Current File before Overwriting (Safety Net)
        // Fetch current file info
        $curSql = "SELECT FilePath, FileName, FileSize FROM Files WHERE Id = ?";
        $curStmt = sqlsrv_query($conn, $curSql, array($fileId));
        
        if ($curStmt && $curRow = sqlsrv_fetch_array($curStmt, SQLSRV_FETCH_ASSOC)) {
             $currentFilePath = $curRow['FilePath'];
             
             // Create new version for 'Current' state
             // Determine next version number
             $maxVerSql = "SELECT MAX(VersionNumber) as MaxVer FROM FileVersions WHERE FileId = ?";
             $maxVerStmt = sqlsrv_query($conn, $maxVerSql, array($fileId));
             $newVer = 1;
             if ($maxVerStmt && $mRow = sqlsrv_fetch_array($maxVerStmt, SQLSRV_FETCH_ASSOC)) {
                 $newVer = $mRow['MaxVer'] + 1;
             }

             $versionsDir = "../uploads/versions/";
             $archivedName = $fileId . "_v" . $newVer . "_" . $curRow['FileName'];
             $archivedPath = $versionsDir . $archivedName;

             if (file_exists($currentFilePath)) {
                 rename($currentFilePath, $archivedPath);

                 // Insert 'Current' into history
                 $insSql = "INSERT INTO FileVersions (FileId, VersionNumber, FilePath, FileName, FileSize, UploadedByUserId) VALUES (?, ?, ?, ?, ?, ?)";
                 // Note: We use the userId of who is restoring as the 'uploader' of this archived state effectively? 
                 // Or we keep original owner? For now, using current user as 'Actioner' or maybe we should fetch original OwnerId?
                 // Let's use $userId as the person causing the archive.
                 sqlsrv_query($conn, $insSql, array($fileId, $newVer, $archivedPath, $curRow['FileName'], $curRow['FileSize'], $userId));
             }
        }

        // 3. Restore the Old Version
        // We COPY the history file back to a main active path (or rename it back if we want to remove from history? No, copy is better to keep history intact).
        // Actually, if we Restore Version 1, Version 1 should stay in history (as it was at that time).
        // And 'Current' becomes a copy of Version 1.
        
        $newActivePath = "../uploads/" . time() . "_restored_" . $historyFileName;
        
        if (copy($historyFilePath, $newActivePath)) {
            $updateSql = "UPDATE Files SET FilePath = ?, FileName = ?, FileSize = ?, UploadDate = GETDATE() WHERE Id = ?";
            $updateParams = array($newActivePath, $historyFileName, $historyFileSize, $fileId);
            
            if (sqlsrv_query($conn, $updateSql, $updateParams)) {
                echo json_encode(array("message" => "File restored successfully."));
            } else {
                 http_response_code(500);
                 echo json_encode(array("message" => "Failed to update file record."));
            }
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Failed to restore physical file."));
        }

    } else {
        http_response_code(404);
        echo json_encode(array("message" => "Version not found."));
    }

} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
