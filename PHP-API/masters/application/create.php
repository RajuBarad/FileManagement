<?php
// header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
// header("Access-Control-Allow-Methods: POST");
// header("Access-Control-Max-Age: 3600");
// header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->visitingDate) && !empty($data->visitorName) && !empty($data->villageId)) {
    $channelId = isset($data->channelId) && !empty($data->channelId) ? intval($data->channelId) : null;
    if ($channelId === null) {
        $sqlDef = "SELECT TOP 1 Id FROM Channels WHERE IsDefault = 1";
        $stmtDef = sqlsrv_query($conn, $sqlDef);
        if ($stmtDef && $rowDef = sqlsrv_fetch_array($stmtDef, SQLSRV_FETCH_ASSOC)) {
            $channelId = (int)$rowDef['Id'];
        }
    }

    $followupId = isset($data->followupId) && !empty($data->followupId) ? intval($data->followupId) : null;
    if ($followupId === null) {
        $sqlDefF = "SELECT TOP 1 Id FROM Followups WHERE IsDefault = 1";
        $stmtDefF = sqlsrv_query($conn, $sqlDefF);
        if ($stmtDefF && $rowDefF = sqlsrv_fetch_array($stmtDefF, SQLSRV_FETCH_ASSOC)) {
            $followupId = (int)$rowDefF['Id'];
        }
        if ($followupId === null) {
            $sqlFallback = "SELECT TOP 1 Id FROM Followups ORDER BY Sequence ASC";
            $stmtFallback = sqlsrv_query($conn, $sqlFallback);
            if ($stmtFallback && $rowFallback = sqlsrv_fetch_array($stmtFallback, SQLSRV_FETCH_ASSOC)) {
                $followupId = (int)$rowFallback['Id'];
            }
        }
    }

    $sql = "INSERT INTO Applications (VisitingDate, VisitorName, MobileNo, VillageId, Description, Reference, ChannelId, FollowupId) 
            OUTPUT INSERTED.Id VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $params = array($data->visitingDate, $data->visitorName, $data->mobileNo, $data->villageId, $data->description, $data->reference, $channelId, $followupId);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if($stmt) {
        $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
        $appId = $row['Id'];
        
        $assignedToUserIds = isset($data->assignedToUserIds) ? $data->assignedToUserIds : array();
        if (is_array($assignedToUserIds)) {
            foreach($assignedToUserIds as $userId) {
                $assignSql = "INSERT INTO ApplicationAssignments (ApplicationId, UserId) VALUES (?, ?)";
                sqlsrv_query($conn, $assignSql, array($appId, intval($userId)));
            }
        }
        
        http_response_code(201);
        echo json_encode(array("message" => "Application was created.", "id" => $appId));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to create application.", "error" => sqlsrv_errors()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to create application. Data is incomplete."));
}
?>
