<?php
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id)) {
    // 1. Find the Completed followup status ID
    $sqlFollowup = "SELECT TOP 1 Id FROM Followups WHERE IsCompleted = 1";
    $stmtFollowup = sqlsrv_query($conn, $sqlFollowup);
    $followupId = null;
    if($stmtFollowup && $row = sqlsrv_fetch_array($stmtFollowup, SQLSRV_FETCH_ASSOC)) {
        $followupId = intval($row['Id']);
    } else {
        // Fallback to name 'Completed'
        $sqlFallback = "SELECT TOP 1 Id FROM Followups WHERE Name = 'Completed'";
        $stmtFallback = sqlsrv_query($conn, $sqlFallback);
        if($stmtFallback && $rowFb = sqlsrv_fetch_array($stmtFallback, SQLSRV_FETCH_ASSOC)) {
            $followupId = intval($rowFb['Id']);
        }
    }

    if($followupId !== null) {
        $sql = "UPDATE Applications SET FollowupId = ? WHERE Id = ?";
        $params = array($followupId, $data->id);
        $stmt = sqlsrv_query($conn, $sql, $params);
        
        if($stmt) {
            http_response_code(200);
            echo json_encode(array("message" => "Task was marked as completed."));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Unable to update task status.", "error" => sqlsrv_errors()));
        }
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "Completed followup status not found in database."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to update task status. Data is incomplete."));
}
?>
