<?php
// PHP-API/add_invoice_items_columns.php
include_once 'config/db.php';
header("Content-Type: application/json; charset=UTF-8");

$sql = "
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Invoices]') AND name = 'FeeItems')
BEGIN
    ALTER TABLE Invoices ADD FeeItems NVARCHAR(MAX) NULL;
    PRINT 'Added FeeItems column to Invoices.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Invoices]') AND name = 'ExpenseItems')
BEGIN
    ALTER TABLE Invoices ADD ExpenseItems NVARCHAR(MAX) NULL;
    PRINT 'Added ExpenseItems column to Invoices.';
END
";

$stmt = sqlsrv_query($conn, $sql);
if ($stmt === false) {
    echo json_encode(array("status" => "error", "error" => sqlsrv_errors()));
} else {
    // Update existing sample invoice if present
    $sampleFeeItems = json_encode([
        ["name" => "RECON", "subText" => "PART PAYMENT", "amount" => 100000]
    ]);
    $sampleExpenseItems = json_encode([]);
    $upSql = "UPDATE Invoices SET FeeItems = ?, ExpenseItems = ? WHERE InvoiceNo = 'R/LEGAL/044' AND FeeItems IS NULL";
    sqlsrv_query($conn, $upSql, [$sampleFeeItems, $sampleExpenseItems]);

    echo json_encode(array("status" => "success", "message" => "FeeItems and ExpenseItems columns ensured successfully."));
}
?>
