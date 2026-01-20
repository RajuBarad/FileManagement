<?php
include_once '../config/db.php';

if($_SERVER['REQUEST_METHOD'] == 'GET') {
    // Ideally check if requester is Admin, but for simplicity we allow logged in users (or all for now)
    
    $sql = "SELECT Id, Username, Role FROM Users";
    $stmt = sqlsrv_query($conn, $sql);
    
    if($stmt === false) {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }
    
    $users = array();
    while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $users[] = array(
            "id" => $row['Id'], // Keep case consistent depending on frontend model
            "name" => $row['Username'],
            "email" => $row['Username'], // Map username to email for frontend compatibility
            "role" => $row['Role']
        );
    }
    
    echo json_encode($users);
} else {
    http_response_code(405);
    echo json_encode(array("message" => "Method not allowed."));
}
?>
