<?php
// PHP-API/history/list.php
header("Content-Type: application/json; charset=UTF-8");
// header("Access-Control-Allow-Origin: *");
// header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
// header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../config/db.php';

// Authorization check: Only admin can view user history
$requestUserId = isset($_SERVER['HTTP_X_USER_ID']) ? $_SERVER['HTTP_X_USER_ID'] : null;
if ($requestUserId) {
    $authSql = "SELECT Role FROM Users WHERE Id = ?";
    $authStmt = sqlsrv_query($conn, $authSql, array($requestUserId));
    if ($authStmt && $authUser = sqlsrv_fetch_array($authStmt, SQLSRV_FETCH_ASSOC)) {
        if (strtolower($authUser['Role'] ?? '') !== 'admin') {
            http_response_code(403);
            echo json_encode(array("status" => "error", "message" => "Access denied. Only administrators can view history."));
            exit;
        }
    }
}


$userId = isset($_GET['userId']) && $_GET['userId'] !== '' && $_GET['userId'] !== 'all' ? $_GET['userId'] : null;
$module = isset($_GET['module']) && $_GET['module'] !== '' && $_GET['module'] !== 'all' ? $_GET['module'] : null;
$action = isset($_GET['action']) && $_GET['action'] !== '' && $_GET['action'] !== 'all' ? $_GET['action'] : null;
$search = isset($_GET['search']) && trim($_GET['search']) !== '' ? trim($_GET['search']) : null;
$startDate = isset($_GET['startDate']) && trim($_GET['startDate']) !== '' ? trim($_GET['startDate']) : null;
$endDate = isset($_GET['endDate']) && trim($_GET['endDate']) !== '' ? trim($_GET['endDate']) : null;

$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$limit = isset($_GET['limit']) ? max(1, min(200, intval($_GET['limit']))) : 30;
$offset = ($page - 1) * $limit;

$whereClauses = array();
$params = array();

if ($userId !== null) {
    $whereClauses[] = "UserId = ?";
    $params[] = intval($userId);
}

if ($module !== null) {
    $whereClauses[] = "Module = ?";
    $params[] = $module;
}

if ($action !== null) {
    $whereClauses[] = "Action = ?";
    $params[] = $action;
}

if ($search !== null) {
    $whereClauses[] = "(UserName LIKE ? OR EntityName LIKE ? OR Action LIKE ? OR Details LIKE ?)";
    $likeTerm = '%' . $search . '%';
    $params[] = $likeTerm;
    $params[] = $likeTerm;
    $params[] = $likeTerm;
    $params[] = $likeTerm;
}

if ($startDate !== null) {
    $whereClauses[] = "CreatedAt >= ?";
    $params[] = $startDate . " 00:00:00";
}

if ($endDate !== null) {
    $whereClauses[] = "CreatedAt <= ?";
    $params[] = $endDate . " 23:59:59";
}

$whereSql = "";
if (count($whereClauses) > 0) {
    $whereSql = "WHERE " . implode(" AND ", $whereClauses);
}

// 1. Total matching count
$countSql = "SELECT COUNT(*) as totalCount FROM UserActivityLogs $whereSql";
$countStmt = sqlsrv_query($conn, $countSql, $params);
$total = 0;
if ($countStmt && $cRow = sqlsrv_fetch_array($countStmt, SQLSRV_FETCH_ASSOC)) {
    $total = intval($cRow['totalCount']);
}

// 2. Fetch paginated logs
$dataSql = "
    SELECT Id, UserId, UserName, UserRole, Module, Action, EntityName, EntityId, Details, IpAddress, CreatedAt
    FROM UserActivityLogs
    $whereSql
    ORDER BY CreatedAt DESC, Id DESC
    OFFSET $offset ROWS FETCH NEXT $limit ROWS ONLY
";

$dataStmt = sqlsrv_query($conn, $dataSql, $params);
$logs = array();

if ($dataStmt) {
    while ($row = sqlsrv_fetch_array($dataStmt, SQLSRV_FETCH_ASSOC)) {
        $createdDate = $row['CreatedAt'];
        $formattedDate = $createdDate instanceof DateTime ? $createdDate->format('Y-m-d H:i:s') : (string)$createdDate;
        
        $logs[] = array(
            "id" => $row['Id'],
            "userId" => $row['UserId'] !== null ? (string)$row['UserId'] : null,
            "userName" => $row['UserName'] ?: 'System',
            "userRole" => $row['UserRole'] ?: 'User',
            "module" => $row['Module'],
            "action" => $row['Action'],
            "entityName" => $row['EntityName'],
            "entityId" => $row['EntityId'],
            "details" => $row['Details'],
            "ipAddress" => $row['IpAddress'],
            "createdAt" => $formattedDate
        );
    }
}

// 3. Stats for dashboard cards
$statsSql = "
    SELECT 
        COUNT(*) as totalActivities,
        SUM(CASE WHEN CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END) as todayCount,
        COUNT(DISTINCT UserId) as activeUserCount
    FROM UserActivityLogs
";
$statsStmt = sqlsrv_query($conn, $statsSql);
$stats = array(
    "totalActivities" => 0,
    "todayCount" => 0,
    "activeUserCount" => 0,
    "modules" => array()
);
if ($statsStmt && $sRow = sqlsrv_fetch_array($statsStmt, SQLSRV_FETCH_ASSOC)) {
    $stats["totalActivities"] = intval($sRow['totalActivities']);
    $stats["todayCount"] = intval($sRow['todayCount']);
    $stats["activeUserCount"] = intval($sRow['activeUserCount']);
}

// Module breakdown stats
$modSql = "SELECT Module, COUNT(*) as cnt FROM UserActivityLogs GROUP BY Module ORDER BY cnt DESC";
$modStmt = sqlsrv_query($conn, $modSql);
if ($modStmt) {
    while ($mRow = sqlsrv_fetch_array($modStmt, SQLSRV_FETCH_ASSOC)) {
        $stats["modules"][$mRow['Module']] = intval($mRow['cnt']);
    }
}

echo json_encode(array(
    "status" => "success",
    "total" => $total,
    "page" => $page,
    "limit" => $limit,
    "totalPages" => ceil($total / $limit),
    "data" => $logs,
    "stats" => $stats
));
?>
