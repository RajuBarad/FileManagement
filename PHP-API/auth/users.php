<?php
include_once '../config/db.php';

if($_SERVER['REQUEST_METHOD'] == 'GET') {
    // Ideally check if requester is Admin, but for simplicity we allow logged in users (or all for now)
    
    $sql = "SELECT u.Id, u.Username, u.Role, u.ParentUserId, pu.Username as ParentName 
            FROM Users u 
            LEFT JOIN Users pu ON CAST(u.ParentUserId AS NVARCHAR(36)) = CAST(pu.Id AS NVARCHAR(36))";
    $stmt = sqlsrv_query($conn, $sql);
    
    if($stmt === false) {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }
    
    $users = array();
    while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $users[] = array(
            "id" => (string)$row['Id'], // Keep ID strictly string
            "name" => $row['Username'],
            "email" => $row['Username'],
            "role" => $row['Role'],
            "parentUserId" => $row['ParentUserId'] !== null ? (string)$row['ParentUserId'] : null,
            "parentName" => $row['ParentName']
        );
    }
    
    echo json_encode($users);
} else {
    http_response_code(405);
    echo json_encode(array("message" => "Method not allowed."));
}
?>
