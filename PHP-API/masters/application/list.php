<?php
// header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$sql = "SELECT a.Id, a.VisitingDate, a.VisitorName, a.MobileNo, a.VillageId, v.Name as VillageName, 
               t.Id as TalukaId, t.Name as TalukaName, d.Name as DistrictName, s.Name as StateName, c.Name as CountryName,
               a.Description, a.Reference, a.CreatedAt 
        FROM Applications a 
        JOIN Villages v ON a.VillageId = v.Id 
        JOIN Talukas t ON v.TalukaId = t.Id 
        JOIN Districts d ON t.DistrictId = d.Id
        JOIN States s ON d.StateId = s.Id
        JOIN Countries c ON s.CountryId = c.Id
        ORDER BY a.VisitingDate DESC, a.Id DESC";
$stmt = sqlsrv_query($conn, $sql);

if($stmt === false) {
    http_response_code(500);
    die(json_encode(array("error" => sqlsrv_errors())));
}

$applications = array();
while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    array_push($applications, array(
        "id" => $row['Id'],
        "visitingDate" => $row['VisitingDate'] ? $row['VisitingDate']->format('Y-m-d') : null,
        "visitorName" => $row['VisitorName'],
        "mobileNo" => $row['MobileNo'],
        "villageId" => $row['VillageId'],
        "villageName" => $row['VillageName'],
        "talukaId" => $row['TalukaId'],
        "talukaName" => $row['TalukaName'],
        "districtName" => $row['DistrictName'],
        "stateName" => $row['StateName'],
        "countryName" => $row['CountryName'],
        "description" => $row['Description'],
        "reference" => $row['Reference'],
        "createdAt" => $row['CreatedAt'] ? $row['CreatedAt']->format('Y-m-d H:i:s') : null
    ));
}

echo json_encode($applications);
?>
