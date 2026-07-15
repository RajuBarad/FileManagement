<?php
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$sql = "SELECT Id, Name, ReminderDays, IsDefault, IsCompleted, Sequence, CreatedAt FROM Followups ORDER BY Sequence ASC, Name ASC";
$stmt = sqlsrv_query($conn, $sql);

if($stmt === false) {
    http_response_code(500);
    die(json_encode(array("error" => sqlsrv_errors())));
}

$followups = array();
while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    array_push($followups, array(
        "id" => $row['Id'],
        "name" => $row['Name'],
        "reminderDays" => $row['ReminderDays'],
        "isDefault" => isset($row['IsDefault']) ? (bool)$row['IsDefault'] : false,
        "isCompleted" => isset($row['IsCompleted']) ? (bool)$row['IsCompleted'] : false,
        "sequence" => isset($row['Sequence']) ? (int)$row['Sequence'] : 0,
        "createdAt" => $row['CreatedAt'] ? $row['CreatedAt']->format('Y-m-d H:i:s') : null
    ));
}

echo json_encode($followups);
?>
