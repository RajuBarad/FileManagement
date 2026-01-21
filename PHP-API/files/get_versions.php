<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/db.php';

$fileId = isset($_GET['fileId']) ? $_GET['fileId'] : null;

if (!$fileId) {
    http_response_code(400);
    echo json_encode(array("message" => "File ID required."));
    exit;
}

$sql = "SELECT v.Id, v.VersionNumber, v.FileName, v.FileSize, v.UploadedAt, u.Username as UploadedByName 
        FROM FileVersions v
        LEFT JOIN Users u ON v.UploadedByUserId = u.Id
        WHERE v.FileId = ?
        ORDER BY v.VersionNumber DESC";

$params = array($fileId);
$stmt = sqlsrv_query($conn, $sql, $params);

if ($stmt) {
    $versions = array();
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $versions[] = array(
            "id" => $row['Id'],
            "versionNumber" => $row['VersionNumber'],
            "fileName" => $row['FileName'],
            "fileSize" => $row['FileSize'],
            "uploadedAt" => $row['UploadedAt'], // DateTime object usually
            "uploadedByName" => $row['UploadedByName']
        );
    }
    echo json_encode($versions);
} else {
    http_response_code(500);
    echo json_encode(array("error" => sqlsrv_errors()));
}
?>
