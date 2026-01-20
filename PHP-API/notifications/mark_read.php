<?php
include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->notificationIds) && is_array($data->notificationIds)) {
    $ids = $data->notificationIds;
    // Simple loop update or IN clause
    if(count($ids) > 0) {
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $sql = "UPDATE Notifications SET IsRead = 1 WHERE Id IN ($placeholders)";
        if(sqlsrv_query($conn, $sql, $ids)) {
            echo json_encode(array("message" => "Marked as read."));
        } else {
            http_response_code(500);
            print_r(sqlsrv_errors());
        }
    }
} else {
    http_response_code(400);
}
?>
