<?php
//header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$sql = "SELECT v.Id, v.Name, v.TalukaId, t.Name as TalukaName, 
               d.Name as DistrictName, s.Name as StateName, c.Name as CountryName, v.CreatedAt 
        FROM Villages v 
        JOIN Talukas t ON v.TalukaId = t.Id 
        JOIN Districts d ON t.DistrictId = d.Id
        JOIN States s ON d.StateId = s.Id
        JOIN Countries c ON s.CountryId = c.Id
        ORDER BY v.Name ASC";
$stmt = sqlsrv_query($conn, $sql);

if($stmt === false) {
    http_response_code(500);
    die(json_encode(array("error" => sqlsrv_errors())));
}

$villages = array();
while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    $village = array(
        "id" => $row['Id'],
        "name" => $row['Name'],
        "talukaId" => $row['TalukaId'],
        "talukaName" => $row['TalukaName'],
        "districtName" => $row['DistrictName'],
        "stateName" => $row['StateName'],
        "countryName" => $row['CountryName'],
        "createdAt" => $row['CreatedAt'] ? $row['CreatedAt']->format('Y-m-d H:i:s') : null
    );
    array_push($villages, $village);
}

echo json_encode($villages);
?>
