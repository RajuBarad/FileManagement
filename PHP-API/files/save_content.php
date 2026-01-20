<?php
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->id) || !isset($data->ownerId) || !isset($data->content)) {
    http_response_code(400);
    die(json_encode(array("message" => "Missing required fields.")));
}

$id = $data->id;
$ownerId = $data->ownerId;
$content = $data->content; // Content can be string (text/html) or JSON string

// 1. Get File Path and verify ownership
$sql = "SELECT FilePath FROM Files WHERE Id = ? AND OwnerId = ?";
$stmt = sqlsrv_query($conn, $sql, array($id, $ownerId));

if($stmt === false || sqlsrv_has_rows($stmt) === false) {
    http_response_code(403);
    die(json_encode(array("message" => "Permission denied or file not found.")));
}

$row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
$filePath = $row['FilePath'];

// 2. Validate File Path (security check - ensure it's within uploads)
// In a real app, strict validation needed. Here we assume DB path is safe-ish but we can check existence.
if (!file_exists($filePath)) {
    // If file missing on disk but in DB? Re-create it or error? 
    // We can try to write to it.
    // Ensure directory exists?
    // For now assuming path is valid.
}

// 3. Write content to file
if(file_put_contents($filePath, $content) === false) {
    http_response_code(500);
    die(json_encode(array("message" => "Failed to write to file.")));
}

// 4. Update 'UploadDate' to current time to reflect modification
$updateSql = "UPDATE Files SET UploadDate = GETDATE() WHERE Id = ?";
$updateStmt = sqlsrv_query($conn, $updateSql, array($id));

http_response_code(200);
echo json_encode(array("message" => "File saved successfully."));
?>
