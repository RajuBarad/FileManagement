<?php
include_once '../config/db.php';

$userId = null;
$token = null;

// 1. Check HTTP Headers
$headers = getallheaders();
if (isset($headers['Authorization']) && preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
    $token = $matches[1];
} elseif (isset($headers['X-Auth-Token'])) {
    $token = $headers['X-Auth-Token'];
}

if (isset($headers['X-User-Id'])) {
    $userId = $headers['X-User-Id'];
}

// 2. Check JSON Body if POST
if (!$userId || !$token) {
    $data = json_decode(file_get_contents("php://input"));
    if ($data) {
        if (isset($data->userId)) $userId = $data->userId;
        if (isset($data->token)) $token = $data->token;
    }
}

// 3. Check Query Parameters
if (!$userId && isset($_GET['userId'])) {
    $userId = $_GET['userId'];
}
if (!$token && isset($_GET['token'])) {
    $token = $_GET['token'];
}

if (!$userId || !$token) {
    http_response_code(401);
    echo json_encode(array("valid" => false, "message" => "Missing user ID or token."));
    exit;
}

$sql = "SELECT Id, Username, Role, AuthToken FROM Users WHERE Id = ?";
$stmt = sqlsrv_query($conn, $sql, array($userId));

if ($stmt === false) {
    http_response_code(500);
    die(json_encode(array("error" => sqlsrv_errors())));
}

if (sqlsrv_has_rows($stmt)) {
    $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
    
    if (!empty($row['AuthToken']) && hash_equals($row['AuthToken'], $token)) {
        http_response_code(200);
        echo json_encode(array(
            "valid" => true,
            "user" => array(
                "id" => (string)$row['Id'],
                "name" => $row['Username'],
                "role" => $row['Role']
            )
        ));
    } else {
        http_response_code(401);
        echo json_encode(array(
            "valid" => false,
            "message" => "Session invalidated. Your password may have been changed. Please log in again."
        ));
    }
} else {
    http_response_code(401);
    echo json_encode(array("valid" => false, "message" => "User not found."));
}
?>
