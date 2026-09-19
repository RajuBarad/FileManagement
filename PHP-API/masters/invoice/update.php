<?php
// PHP-API/masters/invoice/update.php
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id) && !empty($data->invoiceNo) && !empty($data->clientName)) {
    // Check if invoice number is duplicate for another id
    $checkSql = "SELECT Id FROM Invoices WHERE InvoiceNo = ? AND Id != ?";
    $checkStmt = sqlsrv_query($conn, $checkSql, array($data->invoiceNo, $data->id));
    if ($checkStmt && sqlsrv_fetch_array($checkStmt, SQLSRV_FETCH_ASSOC)) {
        http_response_code(409);
        echo json_encode(array("message" => "Another invoice already has this invoice number."));
        exit;
    }

    $sql = "UPDATE Invoices SET
        InvoiceNo = ?,
        InvoiceDate = ?,
        ClientId = ?,
        ClientName = ?,
        ClientAddress = ?,
        PanNo = ?,
        Gstin = ?,
        ParticularsTitle = ?,
        Matter = ?,
        PaymentType = ?,
        ProfessionalFees = ?,
        OutOfPocketExpenses = ?,
        ExpensesNote = ?,
        FeeItems = ?,
        ExpenseItems = ?,
        TotalAmount = ?,
        AmountInWords = ?,
        BankName = ?,
        AccountName = ?,
        AccountNo = ?,
        IfscCode = ?,
        FirmPan = ?,
        Jurisdiction = ?,
        Status = ?,
        Remarks = ?,
        UpdatedAt = GETDATE()
    WHERE Id = ?";

    $invoiceDate = !empty($data->invoiceDate) ? $data->invoiceDate : date('Y-m-d');
    
    // Fee items & total calculation
    $feeItems = isset($data->feeItems) && is_array($data->feeItems) ? $data->feeItems : [];
    $profFees = 0;
    if (!empty($feeItems)) {
        foreach ($feeItems as $item) {
            $profFees += floatval($item->amount ?? $item['amount'] ?? 0);
        }
    } else {
        $profFees = isset($data->professionalFees) ? floatval($data->professionalFees) : 0;
    }

    // Expense items & total calculation
    $expenseItems = isset($data->expenseItems) && is_array($data->expenseItems) ? $data->expenseItems : [];
    $expenses = 0;
    if (!empty($expenseItems)) {
        foreach ($expenseItems as $item) {
            $expenses += floatval($item->amount ?? $item['amount'] ?? 0);
        }
    } else {
        $expenses = isset($data->outOfPocketExpenses) ? floatval($data->outOfPocketExpenses) : 0;
    }

    $total = isset($data->totalAmount) ? floatval($data->totalAmount) : ($profFees + $expenses);

    $params = array(
        trim($data->invoiceNo),
        $invoiceDate,
        !empty($data->clientId) ? intval($data->clientId) : null,
        trim($data->clientName),
        $data->clientAddress ?? null,
        $data->panNo ?? null,
        $data->gstin ?? 'Under RCM applicable to Recipient',
        $data->particularsTitle ?? 'Bill for Professional Services',
        $data->matter ?? null,
        $data->paymentType ?? null,
        $profFees,
        $expenses,
        $data->expensesNote ?? null,
        !empty($feeItems) ? json_encode($feeItems) : null,
        !empty($expenseItems) ? json_encode($expenseItems) : null,
        $total,
        $data->amountInWords ?? null,
        $data->bankName ?? 'Bank of India, Bedipara Br., Rajkot',
        $data->accountName ?? 'Bharat Vasoya & Associates',
        $data->accountNo ?? '310820110000514',
        $data->ifscCode ?? 'BKID0003108',
        $data->firmPan ?? 'AAHFB3723C',
        $data->jurisdiction ?? 'Rajkot City',
        $data->status ?? 'Pending',
        $data->remarks ?? null,
        $data->id
    );

    $stmt = sqlsrv_query($conn, $sql, $params);

    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to update invoice.", "error" => sqlsrv_errors()));
    } else {
        echo json_encode(array("message" => "Invoice was updated successfully."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data. ID, Invoice Number and Client Name are required."));
}
?>
