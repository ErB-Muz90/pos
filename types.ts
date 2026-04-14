// Global declarations for Google API and Identity Services clients
// FIX: Wrapped gapi and google declarations in `declare global` to make them available
// across all modules, as this file is treated as a module due to its exports.
// This is the single source of truth for these global types.
// FIX: Updated global types to augment the Window interface directly. This is a more robust
// way to declare browser globals and resolves errors where properties on `window` are not found.
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export type BusinessType = 'GeneralRetail' | 'Restaurant' | 'Salon' | 'Services';

export enum View {
    POS = 'POS',
    Dashboard = 'Dashboard',
    Inventory = 'Inventory',
    Purchases = 'Purchases',
    Suppliers = 'Suppliers',
    AccountsPayable = 'AccountsPayable',
    PaymentSummary = 'PaymentSummary',
    ShiftReport = 'ShiftReport',
    SalesHistory = 'SalesHistory',
    Customers = 'Customers',
    Quotations = 'Quotations',
    CreateQuotation = 'CreateQuotation',
    Staff = 'Staff',
    TimeSheets = 'TimeSheets',
    Settings = 'Settings',
    TaxReport = 'TaxReport',
    ProfitReport = 'ProfitReport',
    FiscalPeriodReport = 'FiscalPeriodReport',
    // Accounting
    Accounts = 'Accounts',
    GeneralLedger = 'GeneralLedger',
    ChartOfAccounts = 'ChartOfAccounts',
    // POS Sub-menu
    ReturnReceipt = 'ReturnReceipt',
    NewExpense = 'NewExpense',
    Expenditures = 'Expenditures',
    SalesOrder = 'SalesOrder',
    Layaway = 'Layaway',
    WorkOrder = 'WorkOrder',
    HeldReceipts = 'HeldReceipts',
    SalesOrderList = 'SalesOrderList',
    LayawayList = 'LayawayList',
    WorkOrderList = 'WorkOrderList',
    OpenCashDrawer = 'OpenCashDrawer',
    WhatsAppOrders = 'WhatsAppOrders',
}


export interface Product {
  id: string;
  name: string;
  inventoryCode: string; // The primary internal, auto-generated code
  upc?: string; // Universal Product Code / Barcode
  description?: string;
  category: string;
  price: number;
  pricingType: 'inclusive' | 'exclusive';
  productType: 'Inventory' | 'Service';
  costPrice?: number;
  stock: number; // Represents total "On Hand" stock
  reservedStock: number; // Stock committed to open Sales Orders
  imageUrl: string;
  unitOfMeasure: string;
}

export interface CartItem extends Product {
  quantity: number;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
}

export interface Payment {
  method: 'Cash' | 'M-Pesa' | 'Card' | 'Points';
  amount: number;
  details?: {
    transactionCode?: string;
    phoneNumber?: string;
  }
}

export interface Sale {
  id: string;
  items: CartItem[];
  subtotal: number; // Gross total before any discounts
  lineItemsDiscountAmount: number;
  cartDiscountAmount: number;
  cartDiscount?: { type: 'percentage' | 'fixed'; value: number };
  discountAmount: number; // Total of line + cart discounts
  taxableAmount: number;
  tax: number;
  total: number;
  payments: Payment[];
  change: number;
  customerId: string;
  date: Date;
  synced: boolean;
  cashierId: string;
  cashierName: string;
  shiftId: string;
  // Loyalty fields
  pointsEarned: number;
  pointsUsed: number;
  pointsValue: number;
  pointsBalanceAfter: number;
  // Link to original quotation
  quotationId?: string;
  // New fields for returns
  type?: 'Sale' | 'Return';
  originalSaleId?: string;
  returnReason?: string;
  salesOrderId?: string;
  workOrderId?: string;
  layawayId?: string;
  depositApplied?: number;
  // New fields for final SO/WO invoices
  grandTotal?: number;
  balanceDue?: number;
  // KRA eTIMS fields
  kraIcn?: string;
  kraQrCodeData?: string;
}

export type SaleData = Omit<Sale, 'id' | 'synced' | 'cashierId' | 'cashierName' | 'pointsEarned' | 'pointsBalanceAfter' | 'shiftId' | 'kraIcn' | 'kraQrCodeData'>;

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  dateAdded: Date;
  loyaltyPoints: number;
  measurements?: { [key: string]: string };
}

export interface Supplier {
    id: string;
    businessName?: string;
    name: string;
    contact: string;
    email: string;
    creditTerms: string;
}

export interface PurchaseOrderItem {
    productId?: string;
    productName: string;
    quantity: number; // Ordered quantity
    cost: number;
    quantityReceived: number; // Total quantity received for this item so far
    unitOfMeasure: string;
    salesOrderItemId?: string; // Link back to the specific sales order item
}

export interface ReceivedPOItem extends Omit<PurchaseOrderItem, 'quantityReceived'> {
    quantityReceived: number;
    upc?: string;
    category: string;
}

export interface PurchaseOrder {
    id: string;
    poNumber: string;
    supplierId: string;
    items: PurchaseOrderItem[];
    status: 'Draft' | 'Sent' | 'Received' | 'Partially Received' | 'Cancelled';
    createdDate: Date;
    expectedDate: Date;
    receivedDate?: Date;
    totalCost: number;
    salesOrderId?: string;
}

export interface PurchaseOrderData {
    supplierId: string;
    items: Omit<PurchaseOrderItem, 'quantityReceived'>[];
    status: 'Draft' | 'Sent';
    expectedDate: Date;
    salesOrderId?: string;
    orderDate?: string | Date;
}


export interface SupplierPayment {
    id: string;
    invoiceId: string;
    paymentDate: Date;
    amount: number;
    method: 'Bank Transfer' | 'Cash' | 'M-Pesa';
    shiftId?: string;
    processedById: string;
    processedByName: string;
    referenceNumber?: string;
}

export interface SupplierInvoice {
    id: string;
    invoiceNumber: string;
    purchaseOrderId: string;
    supplierId: string;
    invoiceDate: Date;
    dueDate: Date;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    paidAmount: number;
    status: 'Unpaid' | 'Partially Paid' | 'Paid';
}

export interface QuotationItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number; // Price at the time of quotation
  pricingType: 'inclusive' | 'exclusive';
  discount?: { // NEW
    type: 'percentage' | 'fixed';
    value: number;
  };
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  items: QuotationItem[];
  status: 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Expired' | 'Converted' | 'Invoiced';
  createdDate: Date;
  expiryDate: Date;
  subtotal: number;
  discountAmount: number;
  tax: number;
  total: number;
  notes?: string;
  version?: number;
  parentId?: string;
  rejectionReason?: string;
}

export interface QuotationData {
  customerId: string;
  items: QuotationItem[];
  status: 'Draft' | 'Sent';
  notes?: string;
  expiryDate?: Date;
}

export interface LayawayPayment {
  saleId: string;
  date: Date;
  amount: number;
  method: 'Cash' | 'M-Pesa' | 'Card' | 'Points';
  cashierId: string;
}

export interface Layaway {
  id: string; // layawayNumber
  customerId: string;
  customerName: string;
  items: CartItem[];
  total: number;
  deposit: number;
  payments: LayawayPayment[];
  balance: number;
  status: 'Active' | 'Completed' | 'Defaulted' | 'Cancelled';
  createdDate: Date;
  expiryDate: Date;
  cashierId: string;
  cashierName: string;
  shiftId: string;
}

export type WorkOrderPaymentType = "deposit" | "partial" | "final";

export interface WorkOrder {
  id: string;
  quotationId?: string;       // must reference an Approved quotation
  customerId: string;
  customerName: string;
  jobTitle: string;
  description?: string;
  status: "Pending" | "InProgress" | "AwaitingParts" | "Ready" | "Completed" | "Closed" | "Cancelled" | "Warranty";
  priority?: "normal" | "urgent" | "scheduled";
  jobType?: "repair" | "service" | "installation" | "maintenance" | "warranty_claim" | "supply";
  promisedDate?: Date;
  assignedTo?: string;
  labourAmount: number;
  materialsSubtotal: number;
  vatAmount: number;
  totalCost: number;
  depositRequired?: number;
  amountPaid: number;
  balanceDue: number;
  vatMode: "inclusive" | "exclusive";
  hasVariance?: boolean;       // true if any material has varianceFlag
  varianceResolved?: boolean;  // manager approved/absorbed all variances
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  cashierId: string;
  cashierName: string;
  shiftId: string;
}

export interface WorkOrderMaterial {
  id: string;
  workOrderId: string;
  materialId: string;
  name: string;
  qty: number;
  qtyActual?: number;          // actual qty used (may differ from quoted)
  unitPrice: number;
  costPrice?: number;          // for COGS
  lineTotal: number;
  varianceFlag?: boolean;      // true when qtyActual > qty
  varianceResolution?: 'approved' | 'absorbed' | 'requote';
}

export interface WorkOrderPayment {
  id: string;
  workOrderId: string;
  amount: number;
  type: WorkOrderPaymentType;
  method: "cash" | "card" | "mpesa" | "other";
  reference?: string;
  createdAt: Date;
  cashierId: string;
  cashierName: string;
  shiftId: string;
  saleId?: string;
}


export interface SalesOrderItem {
  id: string; // unique ID within the SO
  description: string;
  quantity: number;
  unitPrice: number; // price quoted to customer
  pricingType: 'inclusive' | 'exclusive';
  status: 'Pending' | 'Ordered' | 'Partially Received' | 'Received';
  quantityReceived: number;
  productId?: string; // linked product ID once created
  purchaseOrderId?: string;
}

export interface SalesOrder {
  id: string; // salesOrderNumber
  customerId: string;
  customerName: string;
  items: SalesOrderItem[];
  total: number;
  deposit: number;
  balance: number;
  status: 'Draft' | 'Pending' | 'Ordered' | 'Partially Received' | 'Received' | 'Ready' | 'Completed' | 'Cancelled';
  createdDate: Date;
  deliveryDate?: Date;
  shippingAddress?: string;
  notes?: string;
  cashierId: string;
  cashierName: string;
  shiftId: string;
}

export interface HeldReceipt {
  id: string;
  name: string;
  items: CartItem[];
  customerId: string;
  heldAt: Date;
  cashierId: string;
  cashierName: string;
}


export type Permission = 
  'view_dashboard' | 'view_pos' | 'view_inventory' | 'edit_inventory' | 'delete_inventory' |
  'view_purchases' | 'manage_purchases' | 'view_ap' | 'manage_ap' | 
  'view_shift_report' | 'view_customers' | 'manage_customers' | 'view_settings' |
  'view_quotations' | 'manage_quotations' | 'view_staff' | 'manage_staff' | 'view_sales_history' |
  'view_timesheets' | 'manage_timesheets' | 'view_payment_summary' | 'view_profit_report' |
  'manage_returns' | 'manage_expenditures' | 'manage_sales_orders' | 'manage_layaways' |
  'manage_work_orders' | 'view_held_receipts' | 'open_cash_drawer' | 'manage_whatsapp_orders' |
  'view_suppliers' | 'manage_suppliers' | 'view_general_ledger' | 'manage_chart_of_accounts';


export type Role = 'Admin' | 'Cashier' | 'Supervisor' | 'Accountant';

export interface User {
  id: string;
  name: string;
  email?: string;
  username: string;
  pin?: string; // Optional 4-digit PIN for quick login
  // WARNING: For prototype purposes. In a production, use a secure backend for password handling.
  password?: string;
  role: Role;
  organizationId?: string;
}

export interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface AuditLog {
    id: string;
    timestamp: Date;
    userId: string;
    userName: string;
    action: string;
    details: string;
    hash: string;      // SHA-256 of (prevHash + timestamp + userId + action + details)
    prevHash: string;  // hash of the previous log entry ('' for first entry)
}

export interface Expense {
  id: string;
  shiftId?: string; // Optional: not all payouts are from a shift (e.g., bank transfer)
  cashierId: string;
  cashierName: string;
  date: Date;
  amount: number;
  reason: string;
  payee?: string;
  category?: string;
  source: 'Cash Drawer' | 'M-Pesa' | 'Bank'; // The source of funds
  receiptImageUrl?: string;
}


export interface Shift {
    id: string;
    userId: string;
    userName: string;
    startTime: Date;
    endTime?: Date;
    status: 'active' | 'closed';
    startingFloat: number;
    salesIds: string[];
    expenseIds?: string[];
    // Populated on close
    paymentBreakdown?: { [key in Payment['method']]?: number };
    totalSales?: number;
    totalPayouts?: number;
    expectedCashInDrawer?: number;
    actualCashInDrawer?: number;
    cashVariance?: number;
}

export interface TimeClockEvent {
    id: string;
    userId: string;
    userName: string;
    clockInTime: Date;
    clockOutTime?: Date;
    status: 'clocked-in' | 'clocked-out';
    notes?: string;
}

export interface DriveUser {
    name: string;
    email: string;
    picture: string;
}

// --- ACCOUNTING MODULE TYPES ---
export type AccountType = 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses' | 'Contra Revenue';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  isEditable: boolean; // System accounts cannot be deleted/renamed
}

export interface JournalEntry {
    accountId: string;
    debit: number;
    credit: number;
}

export interface BankDeposit {
  id: string;
  date: Date;
  amount: number;
  bankAccountId: string;
  bankName: string;
  receiptNumber: string;
  depositedById: string;
  depositedByName: string;
  shiftId?: string;
  notes?: string;
  breakdown: {
    cash: number;
    mpesa: number;
    cheques: number;
  };
}

export interface BankWithdrawal {
  id: string;
  date: Date;
  amount: number;
  bankAccountId: string;
  bankName: string;
  reason: string;
  withdrawnById: string;
  withdrawnByName: string;
  referenceNumber?: string;
  notes?: string;
}

export interface AccountingTransaction {
    id: string;
    date: Date;
    description: string;
    referenceId: string; // saleId, payoutId, etc.
    referenceType: 'Sale' | 'Return' | 'Expense' | 'Supplier Payment' | 'Stock Receipt' | 'Bank Deposit' | 'ShiftFloat' | 'WorkOrderDeposit';
    entries: JournalEntry[];
}
// --- END ACCOUNTING MODULE TYPES ---

export interface CategoryInfo {
    path: string;
    description: string;
    color: string;
}

export interface Settings {
    id: string; // Use a fixed ID for the single settings object
    isSetupComplete: boolean;
    businessType: BusinessType;
    businessInfo: {
        name: string;
        kraPin: string;
        logoUrl: string;
        location: string;
        phone: string;
        email?: string;
        branch?: string;
        currency: string;
        language: string;
    };
    tax: {
        vatEnabled: boolean;
        vatRate: number;
        pricingType: 'inclusive' | 'exclusive';
        etimsEnabled: boolean;
    };
    discount: {
        enabled: boolean;
        type: 'percentage' | 'fixed';
        maxValue: number;
    };
    receipt: {
        footer: string;
        invoicePrefix: string;
        quotePrefix: string;
        poNumberPrefix: string;
        layawayPrefix: string;
        workOrderPrefix: string;
        salesOrderPrefix: string;
    };
    layaway: {
        minDepositPercentage: number;
        maxDurationDays: number;
    };
    hardware: {
        printer: {
            type: 'Browser' | 'ESC/POS';
            connection: 'USB' | 'Bluetooth' | 'Network';
            name?: string;
            address?: string;
            vendorId?: number;
            productId?: number;
        };
        barcodeScanner: {
            enabled: boolean;
        };
        barcodePrinter: {
            enabled: boolean;
            type: 'ZPL' | 'Image';
            connection: 'USB' | 'Bluetooth' | 'Network';
            name?: string;
        };
    };
    loyalty: {
        enabled: boolean;
        pointsPerKsh: number;
        redemptionRate: number;
        minRedeemablePoints: number;
        maxRedemptionPercentage: number;
    };
    sessionTimeoutMinutes: number;
    measurements: {
        enabled: boolean;
        units: string[];
    };
    permissions: {
        [key in Role]: Permission[];
    };
    paymentMethods: {
        enabled: boolean;
        displayOnDocuments: ('Invoice' | 'Quotation' | 'Proforma-Invoice' | 'Receipt')[];
        bank: { id: string; bankName: string; accountName: string; accountNumber: string; branch: string; }[];
        mpesaPaybill: {
            paybillNumber: string;
            accountNumber: string;
        };
        mpesaTill: {
            tillNumber: string;
        };
    };
    inventory: {
        lowStockThreshold: number;
        definedCategories?: CategoryInfo[];
        expenseCategories: string[];
    };
    accounting: {
        defaultCashAccountId: string;
        defaultMpesaAccountId: string;
        defaultCardAccountId: string;
        defaultBankAccountId: string;
        defaultSalesAccountId: string;
        defaultVatPayableAccountId: string;
        defaultVatReceivableAccountId: string;
        defaultCogsAccountId: string;
        defaultInventoryAccountId: string;
        defaultSalesReturnAccountId: string;
        defaultAccountsPayableId: string;
        defaultCustomerDepositsId: string;
        defaultShiftClearingId: string;
        defaultExpenseAccountId: string;
        defaultWipAccountId: string;
        reportingBasis: 'cash' | 'accrual';
    };
}

export interface StockMovement {
    id: string;
    productId: string;
    branchId: string;
    type: 'adjustment' | 'recount' | 'damage' | 'theft' | 'return' | 'purchase' | 'sale' | 'transfer_in' | 'transfer_out';
    quantity: number;
    quantityBefore: number;
    quantityAfter: number;
    unitCost?: number;
    userId?: string;
    reason?: string;
    referenceNumber?: string;
    createdAt: Date;
}
