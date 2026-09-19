<?php
// PHP-API/masters/invoice/list.php
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/db.php';

$sql = "SELECT i.Id, i.InvoiceNo, i.InvoiceDate, i.ClientId, i.ClientName, i.ClientAddress,
               i.PanNo, i.Gstin, i.ParticularsTitle, i.Matter, i.PaymentType,
               i.ProfessionalFees, i.OutOfPocketExpenses, i.ExpensesNote,
               i.FeeItems, i.ExpenseItems,
               i.TotalAmount, i.AmountInWords, i.BankName, i.AccountName, i.AccountNo,
               i.IfscCode, i.FirmPan, i.Jurisdiction, i.Status, i.Remarks, i.CreatedAt, i.UpdatedAt,
               c.Name as ClientMasterName, c.MobileNo as ClientMobileNo, c.Email as ClientEmail
        FROM Invoices i
        LEFT JOIN Clients c ON i.ClientId = c.Id
        ORDER BY i.InvoiceDate DESC, i.Id DESC";

$stmt = sqlsrv_query($conn, $sql);

if ($stmt === false) {
    http_response_code(500);
    die(json_encode(array("error" => sqlsrv_errors())));
}

$invoices = array();
while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    $feeItems = [];
    if (!empty($row['FeeItems'])) {
        $decoded = json_decode($row['FeeItems'], true);
        if (is_array($decoded)) {
            $feeItems = $decoded;
        }
    }
    if (empty($feeItems) && ((float)$row['ProfessionalFees'] > 0 || !empty($row['Matter']))) {
        $feeItems = [[
            "name" => $row['Matter'] ?: "PROFESSIONAL FEES",
            "subText" => $row['PaymentType'] ?: "",
            "amount" => (float)$row['ProfessionalFees']
        ]];
    }

    $expenseItems = [];
    if (!empty($row['ExpenseItems'])) {
        $decodedExp = json_decode($row['ExpenseItems'], true);
        if (is_array($decodedExp)) {
            $expenseItems = $decodedExp;
        }
    }
    if (empty($expenseItems) && (float)$row['OutOfPocketExpenses'] > 0) {
        $expenseItems = [[
            "name" => $row['ExpensesNote'] ?: "Out of Pocket Expenses",
            "subText" => "",
            "amount" => (float)$row['OutOfPocketExpenses']
        ]];
    }

    array_push($invoices, array(
        "id" => (int)$row['Id'],
        "invoiceNo" => $row['InvoiceNo'],
        "invoiceDate" => $row['InvoiceDate'] ? $row['InvoiceDate']->format('Y-m-d') : null,
        "clientId" => $row['ClientId'] ? (int)$row['ClientId'] : null,
        "clientName" => $row['ClientName'] ?: $row['ClientMasterName'],
        "clientAddress" => $row['ClientAddress'],
        "clientMobileNo" => $row['ClientMobileNo'] ?? null,
        "clientEmail" => $row['ClientEmail'] ?? null,
        "panNo" => $row['PanNo'],
        "gstin" => $row['Gstin'],
        "particularsTitle" => $row['ParticularsTitle'],
        "matter" => $row['Matter'],
        "paymentType" => $row['PaymentType'],
        "professionalFees" => (float)$row['ProfessionalFees'],
        "outOfPocketExpenses" => (float)$row['OutOfPocketExpenses'],
        "expensesNote" => $row['ExpensesNote'],
        "feeItems" => $feeItems,
        "expenseItems" => $expenseItems,
        "totalAmount" => (float)$row['TotalAmount'],
        "amountInWords" => $row['AmountInWords'],
        "bankName" => $row['BankName'],
        "accountName" => $row['AccountName'],
        "accountNo" => $row['AccountNo'],
        "ifscCode" => $row['IfscCode'],
        "firmPan" => $row['FirmPan'],
        "jurisdiction" => $row['Jurisdiction'],
        "status" => $row['Status'] ?? 'Pending',
        "remarks" => $row['Remarks'],
        "createdAt" => $row['CreatedAt'] ? $row['CreatedAt']->format('Y-m-d H:i:s') : null,
        "updatedAt" => $row['UpdatedAt'] ? $row['UpdatedAt']->format('Y-m-d H:i:s') : null
    ));
}

echo json_encode($invoices);
?>
