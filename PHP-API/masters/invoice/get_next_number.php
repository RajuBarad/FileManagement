<?php
// PHP-API/masters/invoice/get_next_number.php
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

// Find the highest numeric suffix matching R/LEGAL/XXX or similar pattern
$sql = "SELECT TOP 50 InvoiceNo FROM Invoices ORDER BY Id DESC";
$stmt = sqlsrv_query($conn, $sql);

$maxNum = 0;
$prefix = "R/LEGAL/";
$padLength = 3;

if ($stmt !== false) {
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $inv = trim($row['InvoiceNo']);
        if (preg_match('/^(.*?\/)(\d+)$/', $inv, $matches)) {
            $prefix = $matches[1];
            $num = intval($matches[2]);
            if ($num > $maxNum) {
                $maxNum = $num;
                $padLength = max($padLength, strlen($matches[2]));
            }
        }
    }
}

if ($maxNum === 0) {
    $nextNumber = "R/LEGAL/001";
} else {
    $nextNumber = $prefix . str_pad($maxNum + 1, $padLength, '0', STR_PAD_LEFT);
}

echo json_encode(array(
    "nextInvoiceNo" => $nextNumber
));
?>
