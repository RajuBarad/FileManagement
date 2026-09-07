<?php
include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->userId) && isset($data->currentPassword) && isset($data->newPassword)) {
    $userId = $data->userId;
    $currentPassword = $data->currentPassword;
    $newPassword = $data->newPassword;

    if(empty($userId) || empty($currentPassword) || empty($newPassword)) {
        http_response_code(400);
        echo json_encode(array("message" => "All fields are required."));
        exit;
    }

    if(strlen($newPassword) < 4) {
        http_response_code(400);
        echo json_encode(array("message" => "New password must be at least 4 characters long."));
        exit;
    }

    // Fetch existing password hash
    $sql = "SELECT Id, Password FROM Users WHERE Id = ?";
    $stmt = sqlsrv_query($conn, $sql, array($userId));

    if($stmt === false) {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }

    if(sqlsrv_has_rows($stmt)) {
        $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);

        if(password_verify($currentPassword, $row['Password'])) {
            $newHashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
            
            // Invalidate all tokens (AuthToken = NULL) and set new password
            $updateSql = "UPDATE Users SET Password = ?, AuthToken = NULL WHERE Id = ?";
            $updateStmt = sqlsrv_query($conn, $updateSql, array($newHashedPassword, $userId));

            if($updateStmt) {
                http_response_code(200);
                echo json_encode(array(
                    "success" => true,
                    "message" => "Password changed successfully. All active sessions have been invalidated."
                ));
            } else {
                http_response_code(500);
                die(json_encode(array("error" => sqlsrv_errors())));
            }
        } else {
            http_response_code(401);
            echo json_encode(array("message" => "Current password is incorrect."));
        }
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "User not found."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Missing required fields."));
}
?>
