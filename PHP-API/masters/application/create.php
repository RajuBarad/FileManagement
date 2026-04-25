<?php
// header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
// header("Access-Control-Allow-Methods: POST");
// header("Access-Control-Max-Age: 3600");
// header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->visitingDate) && !empty($data->visitorName) && !empty($data->villageId)) {
    $sql = "INSERT INTO Applications (VisitingDate, VisitorName, MobileNo, VillageId, Description, Reference) 
            OUTPUT INSERTED.Id VALUES (?, ?, ?, ?, ?, ?)";
    $params = array($data->visitingDate, $data->visitorName, $data->mobileNo, $data->villageId, $data->description, $data->reference);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if($stmt) {
        $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
        http_response_code(201);
        echo json_encode(array("message" => "Application was created.", "id" => $row['Id']));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to create application.", "error" => sqlsrv_errors()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to create application. Data is incomplete."));
}
?>
