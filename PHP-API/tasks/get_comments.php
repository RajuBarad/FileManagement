<?php
include_once '../config/db.php';

if (isset($_GET['taskId'])) {
    $taskId = $_GET['taskId'];

    $sql = "SELECT c.Id, c.Content, c.CreatedAt, u.Username as AuthorName, u.Id as AuthorId
            FROM TaskComments c
            JOIN Users u ON c.UserId = u.Id
            WHERE c.TaskId = ?
            ORDER BY c.CreatedAt ASC";

    $params = array($taskId);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if ($stmt === false) {
        http_response_code(500);
        die(json_encode(array("error" => sqlsrv_errors())));
    }

    $comments = array();
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $comments[] = array(
            'id' => $row['Id'],
            'content' => $row['Content'],
            'createdAt' => $row['CreatedAt']->format('Y-m-d H:i:s'),
            'authorName' => $row['AuthorName'],
            'authorId' => $row['AuthorId']
        );
    }

    echo json_encode($comments);
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Missing taskId"));
}
?>
