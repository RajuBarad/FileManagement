<?php
include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->id)) {
    $id = $data->id;
    $username = isset($data->name) ? $data->name : null; // Frontend sends 'name' as username
    $role = isset($data->role) ? $data->role : null;
    $password = isset($data->password) && !empty($data->password) ? $data->password : null;

    // Build Error Checking
    if (!$username && !$role && !$password) {
        http_response_code(400);
        echo json_encode(array("message" => "No data to update."));
        exit;
    }

    // Build Dynamic Update Query
    $sql = "UPDATE Users SET ";
    $params = array();
    $updates = array();

    if ($username) {
        $updates[] = "Username = ?";
        $params[] = $username;
    }
    if ($role) {
        $updates[] = "Role = ?";
        $params[] = $role;
    }
    if ($password) {
        $updates[] = "Password = ?";
        $params[] = password_hash($password, PASSWORD_BCRYPT);
    }

    $sql .= implode(", ", $updates);
    $sql .= " WHERE Id = ?";
    $params[] = $id;

    $stmt = sqlsrv_query($conn, $sql, $params);

    if($stmt) {
        http_response_code(200);
        echo json_encode(array("message" => "User updated successfully."));
    } else {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Missing User ID."));
}
?>
