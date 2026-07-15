<?php
// header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$sql = "SELECT a.Id, a.VisitingDate, a.VisitorName, a.MobileNo, a.VillageId, v.Name as VillageName, 
               t.Id as TalukaId, t.Name as TalukaName, d.Name as DistrictName, s.Name as StateName, c.Name as CountryName,
               a.Description, a.Reference, a.ChannelId, ch.Name as ChannelName, a.FollowupId, f.Name as FollowupName, a.CreatedAt,
               CAST(aa.UserId AS NVARCHAR(20)) as AssigneeId, au.Username as AssigneeName,
               f.IsCompleted as IsCompleted, a.IsClosed as IsClosed
        FROM Applications a 
        JOIN Villages v ON a.VillageId = v.Id 
        JOIN Talukas t ON v.TalukaId = t.Id 
        JOIN Districts d ON t.DistrictId = d.Id
        JOIN States s ON d.StateId = s.Id
        JOIN Countries c ON s.CountryId = c.Id
        LEFT JOIN Channels ch ON a.ChannelId = ch.Id
        LEFT JOIN Followups f ON a.FollowupId = f.Id
        LEFT JOIN ApplicationAssignments aa ON a.Id = aa.ApplicationId
        LEFT JOIN Users au ON aa.UserId = au.Id
        ORDER BY a.VisitingDate DESC, a.Id DESC";
$stmt = sqlsrv_query($conn, $sql);

if($stmt === false) {
    http_response_code(500);
    die(json_encode(array("error" => sqlsrv_errors())));
}

$appsMap = array();
while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    $appId = $row['Id'];
    if(!isset($appsMap[$appId])) {
        $appsMap[$appId] = array(
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
            "channelId" => $row['ChannelId'] ? (int)$row['ChannelId'] : null,
            "channelName" => $row['ChannelName'],
            "followupId" => $row['FollowupId'] ? (int)$row['FollowupId'] : null,
            "followupName" => $row['FollowupName'],
            "isCompleted" => isset($row['IsCompleted']) ? (bool)$row['IsCompleted'] : false,
            "isClosed" => isset($row['IsClosed']) ? (bool)$row['IsClosed'] : false,
            "createdAt" => $row['CreatedAt'] ? $row['CreatedAt']->format('Y-m-d H:i:s') : null,
            "assignees" => array()
        );
    }
    
    if($row['AssigneeId']) {
        $appsMap[$appId]['assignees'][] = array(
            'id' => (int)$row['AssigneeId'],
            'name' => $row['AssigneeName']
        );
    }
}

echo json_encode(array_values($appsMap));
?>
