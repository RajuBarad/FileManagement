<?php
// PHP-API/history/log.php
header("Content-Type: application/json; charset=UTF-8");
// header("Access-Control-Allow-Origin: *");
// header("Access-Control-Allow-Methods: POST, OPTIONS");
// header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../config/db.php';
include_once '../services/ActivityLogger.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!empty($data['module']) && !empty($data['action'])) {
    $userId = isset($data['userId']) ? $data['userId'] : null;
    $userName = isset($data['userName']) ? $data['userName'] : null;
    $userRole = isset($data['userRole']) ? $data['userRole'] : null;
    $module = $data['module'];
    $action = $data['action'];
    $entityName = isset($data['entityName']) ? $data['entityName'] : null;
    $entityId = isset($data['entityId']) ? $data['entityId'] : null;
    $details = isset($data['details']) ? $data['details'] : null;

    $success = logUserActivity($conn, $userId, $module, $action, $entityName, $entityId, $details, $userName, $userRole);

    if ($success) {
        http_response_code(201);
        echo json_encode(array("status" => "success", "message" => "Activity logged."));
    } else {
        http_response_code(500);
        echo json_encode(array("status" => "error", "message" => "Failed to log activity.", "error" => sqlsrv_errors()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("status" => "error", "message" => "Module and Action are required."));
}
?>
