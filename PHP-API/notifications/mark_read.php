<?php
include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->notificationId) && isset($data->userId)) {
    $notificationId = $data->notificationId;
    $userId = $data->userId;

    // Handle virtual IDs (e.g. pending requests starting with 'req_')
    if (!is_numeric($notificationId)) {
        if (strpos($notificationId, 'req_') === 0) {
            $reqId = substr($notificationId, 4);
            if (is_numeric($reqId)) {
                $sql = "UPDATE UnlockRequests SET IsNotificationDismissed = 1 WHERE Id = ? AND RequesterUserId = ?";
                $stmt = sqlsrv_query($conn, $sql, array($reqId, $userId));
                if ($stmt) {
                    echo json_encode(array("message" => "Request notification dismissed."));
                    exit;
                }
            }
        }
        // Just return success for virtual items if failed or other type
        echo json_encode(array("message" => "Ignored virtual item."));
        exit;
    }

    $sql = "UPDATE Notifications SET IsRead = 1 WHERE Id = ? AND UserId = ?";
    $params = array($notificationId, $userId);

    $stmt = sqlsrv_query($conn, $sql, $params);

    if($stmt) {
        echo json_encode(array("message" => "Marked as read."));
    } else {
        http_response_code(500);
        echo json_encode(array("error" => sqlsrv_errors()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
