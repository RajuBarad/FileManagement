<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../../config/db.php';

$sql = "SELECT s.Id, s.Name, s.CountryId, c.Name as CountryName, s.CreatedAt 
        FROM States s 
        JOIN Countries c ON s.CountryId = c.Id 
        ORDER BY s.Name ASC";
$stmt = sqlsrv_query($conn, $sql);

if($stmt === false) {
    http_response_code(500);
    die(json_encode(array("error" => sqlsrv_errors())));
}

$states = array();
while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    $state = array(
        "id" => $row['Id'],
        "name" => $row['Name'],
        "countryId" => $row['CountryId'],
        "countryName" => $row['CountryName'],
        "createdAt" => $row['CreatedAt'] ? $row['CreatedAt']->format('Y-m-d H:i:s') : null
    );
    array_push($states, $state);
}

echo json_encode($states);
?>
