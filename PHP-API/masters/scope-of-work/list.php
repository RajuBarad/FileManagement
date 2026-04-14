<?php
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$sql = "SELECT Id, Name, CreatedAt FROM ScopesOfWork ORDER BY Name ASC";
$stmt = sqlsrv_query($conn, $sql);

if($stmt === false) {
    http_response_code(500);
    die(json_encode(array("error" => sqlsrv_errors())));
}

$scopes = array();
while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    array_push($scopes, array(
        "id" => $row['Id'],
        "name" => $row['Name'],
        "createdAt" => $row['CreatedAt'] ? $row['CreatedAt']->format('Y-m-d H:i:s') : null
    ));
}

echo json_encode($scopes);
?>
