<?php
// header("Access-Control-Allow-Origin: *"); // Handled by IIS
header("Content-Type: application/json; charset=UTF-8");
// header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Handled by IIS
// header("Access-Control-Max-Age: 3600");
// header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"); // Handled by IIS

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$serverName = "DESKTOP-LS77LM0\SQLEXPRESS"; // Or your server name
$connectionOptions = array(
    "Database" => "FileManagerDB",
    "Uid" => "sa", // Leave empty for Windows Authentication
    "PWD" => "abcd", // Leave empty for Windows Authentication
    "CharacterSet" => "UTF-8",
    "TrustServerCertificate" => true
);

//Establishes the connection
$conn = sqlsrv_connect($serverName, $connectionOptions);

if ($conn === false) {
    echo json_encode(array("error" => sqlsrv_errors()));
    die(print_r(sqlsrv_errors(), true));
}

// Dynamically detect server host and protocol
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443)) ? "https://" : "http://";
$host = $_SERVER['HTTP_HOST'] ?? 'localhost:888';
$apiBaseUrl = $protocol . $host;
if (!defined('API_BASE_URL')) {
    define('API_BASE_URL', $apiBaseUrl);
}
?>
