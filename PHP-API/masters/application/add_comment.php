<?php
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if (isset($data->applicationId) && isset($data->userId) && isset($data->content)) {
    $applicationId = $data->applicationId;
    $userId = $data->userId;
    $content = $data->content;

    $sql = "INSERT INTO ApplicationComments (ApplicationId, UserId, Content) VALUES (?, ?, ?)";
    $params = array($applicationId, $userId, $content);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if ($stmt) {
        http_response_code(201);
        echo json_encode(array("message" => "Comment added successfully."));
    } else {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
