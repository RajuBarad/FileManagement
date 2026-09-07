<?php
include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->username) && isset($data->password)) {
    $username = $data->username;
    $password = $data->password;

    $sql = "SELECT Id, Username, Password, Role FROM Users WHERE Username = ?";
    $params = array($username);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if($stmt === false) {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }

    if(sqlsrv_has_rows($stmt)) {
        $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
        
        if(password_verify($password, $row['Password'])) {
            $token = bin2hex(random_bytes(32));
            $updateSql = "UPDATE Users SET AuthToken = ? WHERE Id = ?";
            sqlsrv_query($conn, $updateSql, array($token, $row['Id']));

            $user_arr = array(
                "Id" => $row['Id'],
                "Username" => $row['Username'],
                "Role" => $row['Role'],
                "Token" => $token
            );

            // Log activity
            include_once '../services/ActivityLogger.php';
            logUserActivity($conn, $row['Id'], 'Auth', 'Login', 'User Login', $row['Id'], "User '{$row['Username']}' logged in successfully", $row['Username'], $row['Role']);

            http_response_code(200);
            echo json_encode($user_arr);
        } else {
            http_response_code(401);
            echo json_encode(array(
                "message" => "Incorrect password."
            ));
        }
    } else {
        http_response_code(401);
        echo json_encode(array(
            "message" => "User not found."
        ));
    }
} else {
    http_response_code(400);
    echo json_encode(array(
        "message" => "Incomplete data."
    ));
}
?>
