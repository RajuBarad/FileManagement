<?php
include_once '../config/db.php';

if(isset($_GET['fileId'])) {
    $fileId = $_GET['fileId'];
    
    $sql = "SELECT SharedWithUserId FROM GenericShares WHERE FileId = ?";
    $stmt = sqlsrv_query($conn, $sql, array($fileId));
    
    if($stmt === false) {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }
    
    $userIds = array();
    while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $userIds[] = $row['SharedWithUserId'];
    }
    
    echo json_encode($userIds); // Returns array of User IDs [1, 2, 5]
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Missing fileId."));
}
?>
