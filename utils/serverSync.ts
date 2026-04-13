import { Customer, Product, Role, User } from '../types';
import { fetchApi, getAuthToken, getMe, isBackendConfigured, login as loginApi, clearAuthSession, clearCapabilitySnapshot } from './api';
import * as db from './offlineDb';

type BackendUser = {
  id: string;
  username: string;
  email?: string | null;
  fullName?: string | null;
  role?: string | null;
};

type BackendProduct = {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  description?: string | null;
  sellingPrice?: number | string | null;
  costPrice?: number | string | null;
  taxInclusive?: boolean | null;
  isService?: boolean | null;
  unitOfMeasure?: string | null;
  category?: {
    name?: string | null;
  } | null;
  branchInventory?: Array<{
    quantity?: number | string | null;
    reservedQuantity?: number | string | null;
  }>;
};

type BackendCustomer = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  physicalAddress?: string | null;
  town?: string | null;
  createdAt?: string | Date | null;
  loyaltyPoints?: number | null;
};

const WALK_IN_CUSTOMER_ID = 'cust001';

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const toDate = (value: unknown): Date => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' && value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
};

const mapBackendRole = (role?: string | null): Role => {
  switch ((role || '').toLowerCase()) {
    case 'admin':
      return 'Admin';
    case 'manager':
      return 'Supervisor';
    case 'accountant':
      return 'Accountant';
    case 'cashier':
    default:
      return 'Cashier';
  }
};

export const mapBackendUserToFrontendUser = (user: BackendUser): User => ({
  id: user.id,
  name: user.fullName || user.username,
  email: user.email || undefined,
  username: user.username,
  role: mapBackendRole(user.role),
});

const mapBackendProductToFrontendProduct = (product: BackendProduct): Product => {
  const branchInventory = product.branchInventory || [];
  const stock = branchInventory.reduce(
    (sum, item) => sum + toNumber(item.quantity),
    0,
  );
  const reservedStock = branchInventory.reduce(
    (sum, item) => sum + toNumber(item.reservedQuantity),
    0,
  );

  return {
    id: product.id,
    name: product.name,
    inventoryCode: product.sku || product.id,
    upc: product.barcode || undefined,
    description: product.description || undefined,
    category: product.category?.name || 'Uncategorized',
    price: toNumber(product.sellingPrice),
    pricingType: product.taxInclusive ? 'inclusive' : 'exclusive',
    productType: product.isService ? 'Service' : 'Inventory',
    costPrice: toNumber(product.costPrice),
    stock,
    reservedStock,
    imageUrl: '',
    unitOfMeasure: product.unitOfMeasure || 'piece',
  };
};

const mapBackendCustomerToFrontendCustomer = (
  customer: BackendCustomer,
): Customer => ({
  id: customer.id,
  name: customer.name,
  phone: customer.phone || 'N/A',
  email: customer.email || '',
  address: customer.physicalAddress || 'N/A',
  city: customer.town || 'N/A',
  dateAdded: toDate(customer.createdAt),
  loyaltyPoints: customer.loyaltyPoints || 0,
});

const getWalkInCustomer = (): Customer => ({
  id: WALK_IN_CUSTOMER_ID,
  name: 'Walk-in Customer',
  phone: 'N/A',
  email: 'walkin@example.com',
  address: 'N/A',
  city: 'N/A',
  dateAdded: new Date(),
  loyaltyPoints: 0,
});

const ensureWalkInCustomer = (customers: Customer[]): Customer[] => {
  if (customers.some((customer) => customer.id === WALK_IN_CUSTOMER_ID)) {
    return customers;
  }

  return [getWalkInCustomer(), ...customers];
};

export const canUseServerSync = (): boolean =>
  isBackendConfigured() && typeof navigator !== 'undefined' && navigator.onLine;

// Gap 1 — S5: Clock drift helpers
const CLOCK_DRIFT_KEY = 'pos_clock_drift_ms';

export function storeClockDrift(serverTimeIso: string): void {
  const drift = new Date(serverTimeIso).getTime() - Date.now();
  localStorage.setItem(CLOCK_DRIFT_KEY, String(drift));
}

export function getAdjustedNow(): Date {
  const drift = Number(localStorage.getItem(CLOCK_DRIFT_KEY) || '0');
  return new Date(Date.now() + drift);
}

// Gap 6 — F5: Cloud-confirmed cash balance watermark
const CLOUD_CASH_KEY = 'pos_cloud_confirmed_cash';

export function storeCloudConfirmedCash(amount: number): void {
  localStorage.setItem(CLOUD_CASH_KEY, JSON.stringify({ amount, syncedAt: new Date().toISOString() }));
}

export function getCloudConfirmedCash(): { amount: number; syncedAt: string } | null {
  const raw = localStorage.getItem(CLOUD_CASH_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

const fetchPaged = async (path: string, limit = 500): Promise<any[]> => {
  try {
    const res = await fetchApi(`${path}?limit=${limit}`) as any;
    // backend returns { data: [...] } or plain array
    return Array.isArray(res) ? res : (res?.data ?? []);
  } catch {
    return [];
  }
};

export async function hydrateCoreStoresFromServer(): Promise<{
  products: Product[];
  customers: Customer[];
  users: User[];
}> {
  if (!canUseServerSync() || !getAuthToken()) {
    throw new Error('Server sync is not available for this browser session.');
  }

  const me = await getMe();
  const currentUser = mapBackendUserToFrontendUser(me);

  // Gap 3 — A1: Check if capability snapshot is revoked
  try {
    const snapshot = await fetchApi('/auth/capability-snapshot') as any;
    if (snapshot?.revoked) {
      clearAuthSession();
      clearCapabilitySnapshot();
      throw new Error('CAPABILITY_REVOKED');
    }
    if (snapshot) {
      localStorage.setItem('banduka_pos_capability_snapshot', JSON.stringify(snapshot));
    }
  } catch (e: any) {
    if (e?.message === 'CAPABILITY_REVOKED') throw e;
    // non-fatal if endpoint not reachable
  }

  const [productRows, customerRows] = await Promise.all([
    fetchPaged('/products'),
    fetchPaged('/customers'),
  ]);

  const products = (productRows as BackendProduct[]).map(mapBackendProductToFrontendProduct);
  const customers = ensureWalkInCustomer(
    (customerRows as BackendCustomer[]).map(mapBackendCustomerToFrontendCustomer),
  );

  let users: User[] = [currentUser];
  if (currentUser.role === 'Admin' || currentUser.role === 'Supervisor') {
    try {
      const userRows = await fetchPaged('/users', 200) as BackendUser[];
      users = userRows.map(mapBackendUserToFrontendUser);
    } catch {
      users = [currentUser];
    }
  }

  // Hydrate all transactional stores in parallel — failures are non-fatal
  const [sales, expenses, quotations, purchaseOrders, supplierInvoices,
         layaways, workOrders, salesOrders, heldReceipts, shifts, settings, auditLogs] =
    await Promise.all([
      fetchPaged('/sales'),
      fetchPaged('/expenses'),
      fetchPaged('/quotations'),
      fetchPaged('/purchase-orders'),
      fetchPaged('/supplier-invoices'),
      fetchPaged('/layaways'),
      fetchPaged('/work-orders'),
      fetchPaged('/sales-orders'),
      fetchPaged('/held-receipts'),
      fetchPaged('/sales/shifts'),
      fetchApi('/settings').catch(() => null),
      fetchPaged('/audit-logs'),
    ]);

  await Promise.all([
    db.saveAllItems('products', products),
    db.saveAllItems('customers', customers),
    db.saveAllItems('users', users),
    db.saveAllItems('sales', sales),
    db.saveAllItems('payouts', expenses),
    db.saveAllItems('quotations', quotations),
    db.saveAllItems('purchaseOrders', purchaseOrders),
    db.saveAllItems('supplierInvoices', supplierInvoices),
    db.saveAllItems('layaways', layaways),
    db.saveAllItems('workOrders', workOrders),
    db.saveAllItems('salesOrders', salesOrders),
    db.saveAllItems('heldReceipts', heldReceipts),
    db.saveAllItems('shifts', shifts),
    db.saveAllItems('auditLogs', auditLogs),
    settings ? db.saveItem('settings', { id: 'settings', ...settings }) : Promise.resolve(),
  ]);

  // Gap 6 — F5: Compute and store cloud-confirmed cash balance watermark
  try {
    const allSales: any[] = Array.isArray(sales) ? sales : [];
    const allExpenses: any[] = Array.isArray(expenses) ? expenses : [];
    const cashIn = allSales.reduce((sum: number, s: any) => {
      const cashPayment = (s.payments || []).find((p: any) => p.method === 'cash' || p.paymentMethod === 'cash');
      return sum + (cashPayment ? Number(cashPayment.amount) : 0);
    }, 0);
    const cashOut = allExpenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    storeCloudConfirmedCash(cashIn - cashOut);
  } catch { /* non-fatal */ }

  return { products, customers, users };
}

export async function bootstrapSessionFromServer(): Promise<{
  currentUser: User;
  users: User[];
}> {
  if (!canUseServerSync() || !getAuthToken()) {
    throw new Error('No active authenticated backend session found.');
  }

  const me = await getMe();
  const currentUser = mapBackendUserToFrontendUser(me);
  const { users } = await hydrateCoreStoresFromServer();

  return { currentUser, users };
}

export async function loginAndBootstrapFromServer(
  username: string,
  password: string,
): Promise<{
  currentUser: User;
  users: User[];
}> {
  await loginApi({
    username,
    password,
  });

  return bootstrapSessionFromServer();
}
