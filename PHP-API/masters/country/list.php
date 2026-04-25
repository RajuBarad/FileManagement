<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../../config/db.php';

$sql = "SELECT Id, Name, CreatedAt FROM Countries ORDER BY Name ASC";
$stmt = sqlsrv_query($conn, $sql);

if($stmt === false) {
    http_response_code(500);
    die(json_encode(array("error" => sqlsrv_errors())));
}

$countries = array();
while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    $country = array(
        "id" => $row['Id'],
        "name" => $row['Name'],
        "createdAt" => $row['CreatedAt'] ? $row['CreatedAt']->format('Y-m-d H:i:s') : null
    );
    array_push($countries, $country);
}

echo json_encode($countries);
?>
