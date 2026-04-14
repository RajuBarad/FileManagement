<?php
// header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$sql = "SELECT t.Id, t.Name, t.DistrictId, d.Name as DistrictName, t.CreatedAt 
        FROM Talukas t 
        JOIN Districts d ON t.DistrictId = d.Id 
        ORDER BY t.Name ASC";
$stmt = sqlsrv_query($conn, $sql);

if($stmt === false) {
    http_response_code(500);
    die(json_encode(array("error" => sqlsrv_errors())));
}

$talukas = array();
while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    $taluka = array(
        "id" => $row['Id'],
        "name" => $row['Name'],
        "districtId" => $row['DistrictId'],
        "districtName" => $row['DistrictName'],
        "createdAt" => $row['CreatedAt'] ? $row['CreatedAt']->format('Y-m-d H:i:s') : null
    );
    array_push($talukas, $taluka);
}

echo json_encode($talukas);
?>
