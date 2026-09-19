<?php
// PHP-API/create_invoices_table.php
include_once 'config/db.php';
header("Content-Type: application/json; charset=UTF-8");

$sql = "
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Invoices]') AND type in (N'U'))
BEGIN
    CREATE TABLE Invoices (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        InvoiceNo NVARCHAR(100) NOT NULL UNIQUE,
        InvoiceDate DATE NOT NULL,
        ClientId INT NULL,
        ClientName NVARCHAR(255) NOT NULL,
        ClientAddress NVARCHAR(MAX) NULL,
        PanNo NVARCHAR(50) NULL,
        Gstin NVARCHAR(100) NULL,
        ParticularsTitle NVARCHAR(255) DEFAULT 'Bill for Professional Services',
        Matter NVARCHAR(255) NULL,
        PaymentType NVARCHAR(100) NULL,
        ProfessionalFees DECIMAL(18,2) DEFAULT 0,
        OutOfPocketExpenses DECIMAL(18,2) DEFAULT 0,
        ExpensesNote NVARCHAR(MAX) NULL,
        TotalAmount DECIMAL(18,2) DEFAULT 0,
        AmountInWords NVARCHAR(255) NULL,
        BankName NVARCHAR(255) DEFAULT 'Bank of India, Bedipara Br., Rajkot',
        AccountName NVARCHAR(255) DEFAULT 'Bharat Vasoya & Associates',
        AccountNo NVARCHAR(100) DEFAULT '310820110000514',
        IfscCode NVARCHAR(50) DEFAULT 'BKID0003108',
        FirmPan NVARCHAR(50) DEFAULT 'AAHFB3723C',
        Jurisdiction NVARCHAR(100) DEFAULT 'Rajkot City',
        Status NVARCHAR(50) DEFAULT 'Pending',
        Remarks NVARCHAR(MAX) NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE()
    );

    CREATE INDEX IX_Invoices_InvoiceNo ON Invoices(InvoiceNo);
    CREATE INDEX IX_Invoices_ClientId ON Invoices(ClientId);
    CREATE INDEX IX_Invoices_InvoiceDate ON Invoices(InvoiceDate DESC);
END

-- Seed sample invoice if not exists
IF NOT EXISTS (SELECT * FROM Invoices WHERE InvoiceNo = 'R/LEGAL/044')
BEGIN
    INSERT INTO Invoices (
        InvoiceNo, InvoiceDate, ClientName, ClientAddress, PanNo, Gstin,
        ParticularsTitle, Matter, PaymentType, ProfessionalFees, OutOfPocketExpenses,
        TotalAmount, AmountInWords, BankName, AccountName, AccountNo, IfscCode, FirmPan, Jurisdiction, Status
    ) VALUES (
        'R/LEGAL/044',
        '2026-08-26',
        'VAIBHAV PETROLEUM (BPCL)',
        'At. - Chansma Dist.-Patan',
        'AAHFB3723C',
        'Under RCM applicable to Recipient',
        'Bill for Professional Services',
        'RECON',
        'PART PAYMENT',
        100000.00,
        0.00,
        100000.00,
        'TOTAL (Rs. One Lakh Only)',
        'Bank of India, Bedipara Br., Rajkot',
        'Bharat Vasoya & Associates',
        '310820110000514',
        'BKID0003108',
        'AAHFB3723C',
        'Rajkot City',
        'Pending'
    );
END
";

$stmt = sqlsrv_query($conn, $sql);
if ($stmt === false) {
    echo json_encode(array("status" => "error", "error" => sqlsrv_errors()));
} else {
    echo json_encode(array("status" => "success", "message" => "Invoices table ensured and seeded successfully."));
}
?>
