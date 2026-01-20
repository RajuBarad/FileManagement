<?php
include_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->id)) {
    $id = $data->id;

    // Optional: Check for basic protection (e.g. don't delete ID 1 if likely admin)
    // if($id == 1) { ... }

    // Start Transaction? SQL Server supports it but simpler approach first.

    // 1. Delete GenericShares involving this user (Shared WITH them)
    // This is safe to delete as it just removes access
    $delSharesSql = "DELETE FROM GenericShares WHERE SharedWithUserId = ?";
    $stmtShares = sqlsrv_query($conn, $delSharesSql, array($id));
    if($stmtShares === false) {
         http_response_code(500);
         die(json_encode(array("error" => sqlsrv_errors())));
    }

    // 2. Note: If we delete the user, their owned Files will block deletion due to FK.
    // We will catch that error and inform the frontend.
    
    $sql = "DELETE FROM Users WHERE Id = ?";
    $stmt = sqlsrv_query($conn, $sql, array($id));

    if($stmt) {
        http_response_code(200);
        echo json_encode(array("message" => "User deleted successfully."));
    } else {
        $errors = sqlsrv_errors();
        // Check for Constraint violation (547)
        $isConstraint = false;
        if(is_array($errors)) {
            foreach($errors as $error) {
                if($error['code'] == 547) {
                    $isConstraint = true;
                    break;
                }
            }
        }

        http_response_code(409); // Conflict
        if ($isConstraint) {
            echo json_encode(array("message" => "Cannot delete user. They own files or have dependencies."));
        } else {
            echo json_encode(array("error" => $errors));
        }
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Missing User ID."));
}
?>
