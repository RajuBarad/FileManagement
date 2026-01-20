<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../db_connect.php';

$userId = isset($_GET['userId']) ? intval($_GET['userId']) : 0;

if (!$userId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'User ID required']);
    exit;
}

try {
    // Calculate total size of files owned by the user (excluding trash for active storage, or including? usually active files)
    // Let's include everything the user 'owns', even if in trash, or maybe active only. 
    // Typically 'Storage Used' includes everything that takes up space.
    $stmt = $pdo->prepare("SELECT SUM(Size) as totalSize FROM FileSystemItems WHERE OwnerId = ?");
    $stmt->execute([$userId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $totalSizeBytes = $result['totalSize'] ? intval($result['totalSize']) : 0;
    
    // Hardcoded quota for now, e.g., 2 GB (2 * 1024 * 1024 * 1024)
    // You could store this in the Users table if needed.
    $quotaBytes = 2 * 1024 * 1024 * 1024; // 2 GB

    echo json_encode([
        'success' => true,
        'totalUsedBytes' => $totalSizeBytes,
        'quotaBytes' => $quotaBytes
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
