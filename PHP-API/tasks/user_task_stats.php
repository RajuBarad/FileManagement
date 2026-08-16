<?php
include_once '../config/db.php';

if($_SERVER['REQUEST_METHOD'] == 'GET') {
    $sql = "SELECT u.Id, u.Username, u.Role, CAST(u.ParentUserId AS NVARCHAR(36)) as ParentUserId, pu.Username as ParentName,
                   COUNT(DISTINCT ta.TaskId) as TotalTasks,
                   COUNT(DISTINCT CASE WHEN t.Status IN ('Done', 'Completed') THEN ta.TaskId END) as CompletedTasks,
                   COUNT(DISTINCT CASE WHEN t.Status = 'In Progress' THEN ta.TaskId END) as InProgressTasks,
                   COUNT(DISTINCT CASE WHEN t.Status NOT IN ('Done', 'Completed', 'In Progress') AND t.Id IS NOT NULL THEN ta.TaskId END) as PendingTasks
            FROM Users u
            LEFT JOIN Users pu ON CAST(u.ParentUserId AS NVARCHAR(36)) = CAST(pu.Id AS NVARCHAR(36))
            LEFT JOIN TaskAssignments ta ON CAST(u.Id AS NVARCHAR(36)) = CAST(ta.UserId AS NVARCHAR(36))
            LEFT JOIN Tasks t ON ta.TaskId = t.Id
            GROUP BY u.Id, u.Username, u.Role, u.ParentUserId, pu.Username
            ORDER BY CASE WHEN u.ParentUserId IS NULL THEN 0 ELSE 1 END, u.ParentUserId ASC, u.Username ASC";

    $stmt = sqlsrv_query($conn, $sql);

    if($stmt === false) {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }

    $stats = array();
    while($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $total = (int)$row['TotalTasks'];
        $completed = (int)$row['CompletedTasks'];
        $inProgress = (int)$row['InProgressTasks'];
        $pending = (int)$row['PendingTasks'];
        $rate = $total > 0 ? (int)round(($completed / $total) * 100) : 0;

        $stats[] = array(
            "id" => (string)$row['Id'],
            "name" => $row['Username'],
            "role" => $row['Role'],
            "parentUserId" => $row['ParentUserId'] !== null ? (string)$row['ParentUserId'] : null,
            "parentName" => $row['ParentName'],
            "totalTasks" => $total,
            "completedTasks" => $completed,
            "inProgressTasks" => $inProgress,
            "pendingTasks" => $pending,
            "completionRate" => $rate
        );
    }

    echo json_encode($stats);
} else {
    http_response_code(405);
    echo json_encode(array("message" => "Method not allowed."));
}
?>
