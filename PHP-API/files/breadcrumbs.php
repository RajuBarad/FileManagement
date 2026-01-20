<?php
include_once '../config/db.php';

if(isset($_GET['folderId'])) {
    $folderId = $_GET['folderId'];
    
    // Recursive CTE to get ancestors
    $sql = "
        WITH PathCTE AS (
            SELECT Id, FileName, ParentId, OwnerId, 0 AS Level
            FROM Files
            WHERE Id = ?
            UNION ALL
            SELECT f.Id, f.FileName, f.ParentId, f.OwnerId, p.Level + 1
            FROM Files f
            INNER JOIN PathCTE p ON f.Id = p.ParentId
        )
        SELECT CAST(Id AS NVARCHAR(36)) as Id, FileName as Name, OwnerId 
        FROM PathCTE 
        ORDER BY Level DESC;
    ";
    
    $params = array($folderId);
    $stmt = sqlsrv_query($conn, $sql, $params);
    
    if($stmt === false) {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }
    
    $breadcrumbs = array();
    while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $breadcrumbs[] = array(
            'id' => $row['Id'],
            'name' => $row['Name'],
            'ownerId' => $row['OwnerId']
        );
    }
    
    echo json_encode($breadcrumbs);
} else {
    echo json_encode(array()); // Return empty if no folderId (root)
}
?>
