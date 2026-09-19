// file-manager/src/app/core/models/invoice.model.ts

export interface InvoiceItem {
    name: string;
    subText?: string;
    amount: number;
}

export interface Invoice {
    id?: number;
    invoiceNo: string;
    invoiceDate: string;
    clientId?: number | null;
    clientName: string;
    clientAddress?: string;
    clientMobileNo?: string;
    clientEmail?: string;
    panNo?: string;
    gstin?: string;
    particularsTitle?: string;
    matter?: string;
    paymentType?: string;
    professionalFees: number;
    outOfPocketExpenses: number;
    expensesNote?: string;
    feeItems?: InvoiceItem[];
    expenseItems?: InvoiceItem[];
    totalAmount: number;
    amountInWords?: string;
    bankName?: string;
    accountName?: string;
    accountNo?: string;
    ifscCode?: string;
    firmPan?: string;
    jurisdiction?: string;
    status: 'Pending' | 'Paid' | 'Partially Paid' | 'Cancelled';
    remarks?: string;
    createdAt?: string;
    updatedAt?: string;
}
