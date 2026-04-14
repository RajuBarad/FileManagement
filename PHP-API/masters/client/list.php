<?php
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$sql = "SELECT c.Id, c.Name, c.MobileNo, c.Email, c.Address, c.VillageId,
               v.Name as VillageName, t.Name as TalukaName, d.Name as DistrictName, 
               s.Name as StateName, cn.Name as CountryName, c.CreatedAt 
        FROM Clients c
        LEFT JOIN Villages v ON c.VillageId = v.Id
        LEFT JOIN Talukas t ON v.TalukaId = t.Id
        LEFT JOIN Districts d ON t.DistrictId = d.Id
        LEFT JOIN States s ON d.StateId = s.Id
        LEFT JOIN Countries cn ON s.CountryId = cn.Id
        ORDER BY c.Name ASC";
$stmt = sqlsrv_query($conn, $sql);

if($stmt === false) {
    http_response_code(500);
    die(json_encode(array("error" => sqlsrv_errors())));
}

$clients = array();
while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    array_push($clients, array(
        "id" => $row['Id'],
        "name" => $row['Name'],
        "mobileNo" => $row['MobileNo'],
        "email" => $row['Email'],
        "address" => $row['Address'],
        "villageId" => $row['VillageId'],
        "villageName" => $row['VillageName'],
        "talukaName" => $row['TalukaName'],
        "districtName" => $row['DistrictName'],
        "stateName" => $row['StateName'],
        "countryName" => $row['CountryName'],
        "createdAt" => $row['CreatedAt'] ? $row['CreatedAt']->format('Y-m-d H:i:s') : null
    ));
}

echo json_encode($clients);
?>
