<?php
include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->name) && isset($data->password) && isset($data->role)) {
    $username = $data->name; // Frontend sends 'name' (or 'email')
    $password = password_hash($data->password, PASSWORD_BCRYPT);
    $role = $data->role;

    // Check if user exists
    $checkSql = "SELECT Id FROM Users WHERE Username = ?";
    $checkStmt = sqlsrv_query($conn, $checkSql, array($username));
    if(sqlsrv_has_rows($checkStmt)) {
        http_response_code(400);
        echo json_encode(array("message" => "User already exists."));
        exit;
    }

    $sql = "INSERT INTO Users (Username, Password, Role) VALUES (?, ?, ?)";
    $params = array($username, $password, $role);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if($stmt) {
        http_response_code(201);
        echo json_encode(array("message" => "User created successfully."));
    } else {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
