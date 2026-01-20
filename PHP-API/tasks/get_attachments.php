<?php
include_once '../config/db.php';

if(isset($_GET['taskId'])) {
    $taskId = $_GET['taskId'];
    
    $sql = "
    WITH FolderPaths (Id, FullPath) AS (
        SELECT Id, CAST('Home > ' + FileName AS NVARCHAR(MAX))
        FROM Files
        WHERE ParentId IS NULL AND IsFolder = 1
        UNION ALL
        SELECT f.Id, CAST(p.FullPath + ' > ' + f.FileName AS NVARCHAR(MAX))
        FROM Files f
        JOIN FolderPaths p ON f.ParentId = p.Id
        WHERE f.IsFolder = 1
    )
    SELECT CAST(a.Id AS NVARCHAR(36)) as AttachmentId, 
                   CAST(f.Id AS NVARCHAR(36)) as FileId, 
                   f.FileName as Name, 
                   f.FileSize as Size,
                   ISNULL(fp.FullPath, 'Home') as LogicalPath,
                   a.CreatedAt
            FROM TaskAttachments a
            JOIN Files f ON a.FileId = f.Id
            LEFT JOIN FolderPaths fp ON f.ParentId = fp.Id
            WHERE a.TaskId = ?
            ORDER BY a.CreatedAt DESC";
            
    $params = array($taskId);
    $stmt = sqlsrv_query($conn, $sql, $params);
    
    if($stmt === false) {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }
    
    
    $attachments = array();
    
    While($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $ext = pathinfo($row['Name'], PATHINFO_EXTENSION);
        // Construct standard download URL
        $url = "http://localhost:888/files/download.php?id=" . $row['FileId'];
        
        $attachments[] = array(
            'id' => $row['AttachmentId'],
            'fileId' => $row['FileId'],
            'name' => $row['Name'],
            'extension' => $ext,
            'size' => $row['Size'],
            'url' => $url,
            'path' => $row['LogicalPath'],
            'createdAt' => $row['CreatedAt']->format('Y-m-d H:i:s')
        );
    }
    
    echo json_encode($attachments);
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Missing taskId."));
}
?>
