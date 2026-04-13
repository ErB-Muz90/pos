// FIX: Replace 'Payout' with 'Expense' as 'Payout' is not an exported member of types.
import { CartItem, Sale, Product, Customer, Supplier, PurchaseOrder, SupplierInvoice, Quotation, User, Settings, AuditLog, Shift, TimeClockEvent, Expense, Layaway, WorkOrder, SalesOrder, HeldReceipt, SupplierPayment, Account, AccountingTransaction, BankDeposit, WorkOrderMaterial, WorkOrderPayment, BankWithdrawal } from '../types';
import { fetchApi, getAuthToken } from './api';

const DB_NAME = 'BandukaPOS-DB';
const DB_VERSION = 15;
const STORES = [
    'products', 'customers', 'sales', 'suppliers', 'purchaseOrders',
    'supplierInvoices', 'quotations', 'users', 'settings', 'auditLogs',
    'shifts', 'cart', 'orderQueue', 'timeClockEvents', 'payouts',
    'layaways', 'workOrders', 'salesOrders', 'heldReceipts', 'supplierPayments',
    'chartOfAccounts', 'accountingTransactions', 'bankDeposits', 'bankWithdrawals',
    'workOrderMaterials', 'workOrderPayments'
];


let db: IDBDatabase | null = null;
let initPromise: Promise<IDBDatabase> | null = null;
const DATE_FIELDS = [
    'date',
    'dateAdded',
    'startTime',
    'endTime',
    'invoiceDate',
    'dueDate',
    'createdDate',
    'expectedDate',
    'expiryDate',
    'deliveryDate',
    'clockInTime',
    'clockOutTime',
    'heldAt',
];

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export function initDB(): Promise<IDBDatabase> {
    if (db) {
        return Promise.resolve(db);
    }
    if (initPromise) {
        return initPromise;
    }

    console.log('[DB] Initializing IndexedDB...');

    initPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            console.log(`[DB] Upgrading to version ${DB_VERSION}.`);
            STORES.forEach(storeName => {
                if (!dbInstance.objectStoreNames.contains(storeName)) {
                    dbInstance.createObjectStore(storeName, { keyPath: 'id' });
                    console.log(`[DB] Created '${storeName}' store.`);
                }
            });
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('[DB] Database opened successfully.');
            db.onclose = () => {
                console.warn('[DB] Database connection closed.');
                db = null; 
                initPromise = null;
            };
            resolve(db);
        };

        request.onerror = () => {
            console.error('[DB] Database error:', request.error);
            initPromise = null;
            reject(request.error);
        };
    });
    
    return initPromise;
}

async function getStore(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const dbInstance = await initDB();
    const tx = dbInstance.transaction(storeName, mode);
    return tx.objectStore(storeName);
}

// --- Generic Data Operations ---

export async function getAllItems<T>(storeName: string): Promise<T[]> {
    const store = await getStore(storeName, 'readonly');
    return promisifyRequest(store.getAll());
}

export async function getItem<T>(storeName: string, id: string): Promise<T | undefined> {
    const store = await getStore(storeName, 'readonly');
    return promisifyRequest(store.get(id));
}

export async function saveItem<T extends {id: string}>(storeName:string, item: T): Promise<IDBValidKey> {
    const store = await getStore(storeName, 'readwrite');
    return promisifyRequest(store.put(item));
}

export async function saveAllItems<T extends {id: string}>(storeName: string, items: T[]): Promise<void> {
    const store = await getStore(storeName, 'readwrite');
    // Clear before saving all to ensure a clean slate, useful for cart-like stores
    await promisifyRequest(store.clear());
    for(const item of items) {
        await promisifyRequest(store.add(item));
    }
}

export async function deleteItem(storeName: string, id: string): Promise<void> {
    const store = await getStore(storeName, 'readwrite');
    await promisifyRequest(store.delete(id));
}

// --- Offline Order Queue Specific ---

export async function syncPendingOrders(): Promise<{ success: number; failed: number; syncedOrders: Sale[] }> {
    console.log('[DB] Starting sync of pending orders...');
    if (!navigator.onLine) {
        console.log('[DB] Sync attempt stopped: Offline.');
        return { success: 0, failed: 0, syncedOrders: [] };
    }

    const store = await getStore('orderQueue', 'readwrite');
    const orders: Sale[] = await promisifyRequest(store.getAll());
    
    if (orders.length === 0) {
        console.log('[DB] No pending orders to sync.');
        return { success: 0, failed: 0, syncedOrders: [] };
    }

    let successCount = 0;
    let failedCount = 0;
    const syncedOrders: Sale[] = [];
    const branchId = getBranchIdFromToken();

    if (!branchId) {
        throw new Error('Cannot sync offline sales without an authenticated backend session.');
    }

    for (const order of orders) {
        try {
            await fetchApi('/sales', {
                method: 'POST',
                headers: {
                    'x-idempotency-key': `offline-sale-${order.id}`,
                },
                body: JSON.stringify(mapSaleToSyncPayload(order, branchId)),
            });

            await promisifyRequest(store.delete(order.id));
            successCount++;

            const syncedSale = { ...order, synced: true };
            await saveItem('sales', syncedSale);
            syncedOrders.push(syncedSale);
        } catch (error) {
            console.error(`[DB] Failed to sync order ${order.id}:`, error);
            failedCount++;
        }
    }

    console.log(`[DB] Sync finished. Success: ${successCount}, Failed: ${failedCount}.`);
    return { success: successCount, failed: failedCount, syncedOrders };
}

export async function getQueuedOrderCount(): Promise<number> {
    const store = await getStore('orderQueue', 'readonly');
    return promisifyRequest(store.count());
}

// Gap 4 — L1: Soft-reserve stock locally for a layaway
export async function softReserveLayawayStock(
    items: Array<{ id: string; quantity: number }>,
): Promise<void> {
    const products: any[] = await getAllItems('products');
    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const item of items) {
        const product = productMap.get(item.id);
        if (product) {
            const updated = {
                ...product,
                reservedStock: (product.reservedStock || 0) + item.quantity,
            };
            await saveItem('products', updated);
        }
    }
}


// --- Backup, Restore, Wipe ---

export async function getAllData(): Promise<Record<string, any[]>> {
    const allData: Record<string, any[]> = {};
    for (const storeName of STORES) {
        allData[storeName] = await getAllItems(storeName);
    }
    return allData;
}

export async function restoreAllData(data: Record<string, any[]>): Promise<void> {
    try {
        validateBackupData(data);
        for (const storeName of STORES) {
            if(data[storeName]) {
                const store = await getStore(storeName, 'readwrite');
                await promisifyRequest(store.clear());
                for(const item of data[storeName]) {
                    await promisifyRequest(store.put(normalizeBackupItem(item)));
                }
            }
        }
    } catch (error) {
        console.error("Error during data restore process:", error);
        throw new Error("Failed to restore data. The backup file might be corrupted or incompatible.");
    }
}

export async function wipeDatabase(): Promise<void> {
    try {
        if (db) {
            db.close();
            db = null;
            initPromise = null;
        }
        await promisifyRequest(indexedDB.deleteDatabase(DB_NAME));
    } catch (error) {
        console.error("Error wiping the database:", error);
        throw new Error("Failed to wipe database. Please clear your browser's site data manually.");
    }
}

function getBranchIdFromToken(): string | null {
    const token = getAuthToken();
    if (!token) {
        return null;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.branchId || null;
    } catch {
        return null;
    }
}

function mapPaymentMethod(order: Sale): 'cash' | 'mpesa' | 'card' | 'bank_transfer' | 'credit' {
    const primaryPayment = order.payments.find((payment) => payment.method !== 'Points') || order.payments[0];

    switch (primaryPayment?.method) {
        case 'M-Pesa':
            return 'mpesa';
        case 'Card':
            return 'card';
        default:
            return 'cash';
    }
}

function mapSaleToSyncPayload(order: Sale, branchId: string) {
    return {
        branchId,
        customerId: order.customerId || undefined,
        shiftId: order.shiftId || undefined,
        items: order.items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
            discount: item.discount ? calculateLineDiscount(item) : 0,
        })),
        discount: order.discountAmount || 0,
        paymentMethod: mapPaymentMethod(order),
        notes: `Offline sync for sale ${order.id}`,
    };
}

function calculateLineDiscount(item: CartItem): number {
    if (!item.discount) {
        return 0;
    }

    if (item.discount.type === 'fixed') {
        return item.discount.value;
    }

    return (item.price * item.quantity * item.discount.value) / 100;
}

function validateBackupData(data: Record<string, any[]>): void {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Invalid backup format.');
    }

    for (const [storeName, items] of Object.entries(data)) {
        if (!STORES.includes(storeName)) {
            throw new Error(`Unexpected store in backup: ${storeName}`);
        }

        if (!Array.isArray(items)) {
            throw new Error(`Backup store "${storeName}" must be an array.`);
        }

        for (const item of items) {
            if (!item || typeof item !== 'object' || Array.isArray(item)) {
                throw new Error(`Backup item in "${storeName}" must be an object.`);
            }

            if (typeof item.id !== 'string' || item.id.trim() === '') {
                throw new Error(`Backup item in "${storeName}" is missing a valid id.`);
            }
        }
    }
}

function normalizeBackupItem(item: Record<string, any>) {
    const normalized = { ...item };

    for (const field of DATE_FIELDS) {
        if (typeof normalized[field] === 'string') {
            const parsed = new Date(normalized[field]);
            if (Number.isNaN(parsed.getTime())) {
                throw new Error(`Invalid date field "${field}" in backup data.`);
            }
            normalized[field] = parsed;
        }
    }

    return normalized;
}
