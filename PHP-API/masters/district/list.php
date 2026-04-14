<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../../config/db.php';

$sql = "SELECT d.Id, d.Name, d.StateId, s.Name as StateName, d.CreatedAt 
        FROM Districts d 
        JOIN States s ON d.StateId = s.Id 
        ORDER BY d.Name ASC";
$stmt = sqlsrv_query($conn, $sql);

if($stmt === false) {
    http_response_code(500);
    die(json_encode(array("error" => sqlsrv_errors())));
}

$districts = array();
while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    $district = array(
        "id" => $row['Id'],
        "name" => $row['Name'],
        "stateId" => $row['StateId'],
        "stateName" => $row['StateName'],
        "createdAt" => $row['CreatedAt'] ? $row['CreatedAt']->format('Y-m-d H:i:s') : null
    );
    array_push($districts, $district);
}

echo json_encode($districts);
?>
