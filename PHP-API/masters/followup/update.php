<?php
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id) && !empty($data->name)) {
    $reminderDays = isset($data->reminderDays) ? intval($data->reminderDays) : 0;
    $isDefault = isset($data->isDefault) ? ($data->isDefault ? 1 : 0) : 0;
    $isCompleted = isset($data->isCompleted) ? ($data->isCompleted ? 1 : 0) : 0;
    $sequence = isset($data->sequence) ? intval($data->sequence) : 0;
    
    if ($isDefault === 1) {
        $sqlUnset = "UPDATE Followups SET IsDefault = 0";
        sqlsrv_query($conn, $sqlUnset);
    }
    if ($isCompleted === 1) {
        $sqlUnsetComp = "UPDATE Followups SET IsCompleted = 0";
        sqlsrv_query($conn, $sqlUnsetComp);
    }
    
    $sql = "UPDATE Followups SET Name = ?, ReminderDays = ?, IsDefault = ?, IsCompleted = ?, Sequence = ? WHERE Id = ?";
    $params = array($data->name, $reminderDays, $isDefault, $isCompleted, $sequence, $data->id);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if($stmt) {
        http_response_code(200);
        echo json_encode(array("message" => "Followup status was updated."));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to update followup status.", "error" => sqlsrv_errors()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to update followup status. Data is incomplete."));
}
?>
