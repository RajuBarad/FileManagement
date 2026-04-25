<?php
// header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
// header("Access-Control-Allow-Methods: POST");
// header("Access-Control-Max-Age: 3600");
// header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->name)) {
    $reminderDays = isset($data->reminderDays) ? intval($data->reminderDays) : 0;
    
    $sql = "INSERT INTO Channels (Name, ReminderDays) OUTPUT INSERTED.Id VALUES (?, ?)";
    $params = array($data->name, $reminderDays);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if($stmt) {
        $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
        http_response_code(201);
        echo json_encode(array("message" => "Channel was created.", "id" => $row['Id']));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to create channel.", "error" => sqlsrv_errors()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to create channel. Data is incomplete."));
}
?>
