<?php
include_once '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT Id as id, Name as name, Color as color, IsCustom as isCustom, IsCompletedSection as isCompletedSection, SortOrder as sortOrder 
            FROM BoardSections 
            ORDER BY SortOrder ASC";
    $stmt = sqlsrv_query($conn, $sql);
    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(array("error" => sqlsrv_errors()));
        exit();
    }

    $sections = array();
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $sections[] = array(
            "id" => $row['id'],
            "name" => $row['name'],
            "color" => $row['color'],
            "isCustom" => (bool)$row['isCustom'],
            "isCompletedSection" => (bool)$row['isCompletedSection'],
            "sortOrder" => (int)$row['sortOrder']
        );
    }
    echo json_encode($sections);
    exit();
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(array("message" => "Invalid sections array."));
        exit();
    }

    // Collect IDs sent to keep
    $sentIds = array();
    $sort = 1;
    foreach ($data as $sec) {
        $id = isset($sec['id']) ? trim($sec['id']) : '';
        $name = isset($sec['name']) ? trim($sec['name']) : '';
        $color = isset($sec['color']) ? trim($sec['color']) : 'indigo';
        $isCustom = !empty($sec['isCustom']) ? 1 : 0;
        $isCompletedSection = !empty($sec['isCompletedSection']) ? 1 : 0;

        if (empty($id) || empty($name)) continue;

        $sentIds[] = $id;

        // Upsert section
        $checkSql = "SELECT Id FROM BoardSections WHERE Id = ?";
        $checkStmt = sqlsrv_query($conn, $checkSql, array($id));
        if ($checkStmt && sqlsrv_fetch_array($checkStmt, SQLSRV_FETCH_ASSOC)) {
            $upSql = "UPDATE BoardSections 
                      SET Name = ?, Color = ?, IsCustom = ?, IsCompletedSection = ?, SortOrder = ? 
                      WHERE Id = ?";
            sqlsrv_query($conn, $upSql, array($name, $color, $isCustom, $isCompletedSection, $sort, $id));
        } else {
            $inSql = "INSERT INTO BoardSections (Id, Name, Color, IsCustom, IsCompletedSection, SortOrder) 
                      VALUES (?, ?, ?, ?, ?, ?)";
            sqlsrv_query($conn, $inSql, array($id, $name, $color, $isCustom, $isCompletedSection, $sort));
        }
        $sort++;
    }

    // Delete custom sections not in sentIds
    if (!empty($sentIds)) {
        $inClause = implode(',', array_fill(0, count($sentIds), '?'));
        $delSql = "DELETE FROM BoardSections WHERE IsCustom = 1 AND Id NOT IN ($inClause)";
        sqlsrv_query($conn, $delSql, $sentIds);
    }

    echo json_encode(array("message" => "Board sections updated successfully."));
    exit();
}
?>
