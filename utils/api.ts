import { User, Sale, Product, Customer, Supplier, PurchaseOrder, Quotation, Settings, AuditLog, Shift, TimeClockEvent, Expense, Layaway, WorkOrder, SalesOrder, HeldReceipt, SaleData, PurchaseOrderData, ReceivedPOItem, SupplierPayment, SupplierInvoice, Account, AccountingTransaction } from '../types';

const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE_URL = `${API_ORIGIN}/api/v1`;
const ACCESS_TOKEN_KEY = 'banduka_pos_access_token';
const REFRESH_TOKEN_KEY = 'banduka_pos_refresh_token';
// Gap 3 — A1: Offline capability snapshot key
const CAPABILITY_SNAPSHOT_KEY = 'banduka_pos_capability_snapshot';

export const getCapabilitySnapshot = () => {
  const raw = localStorage.getItem(CAPABILITY_SNAPSHOT_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

const storeCapabilitySnapshot = (snapshot: any) => {
  if (snapshot) localStorage.setItem(CAPABILITY_SNAPSHOT_KEY, JSON.stringify(snapshot));
};

export const clearCapabilitySnapshot = () => localStorage.removeItem(CAPABILITY_SNAPSHOT_KEY);

let refreshPromise: Promise<string | null> | null = null;

export const getApiBaseUrl = () => API_BASE_URL;
export const isBackendConfigured = () => Boolean(API_ORIGIN);

const getStoredValue = (key: string) => sessionStorage.getItem(key) || localStorage.getItem(key);

export const getAuthToken = () => getStoredValue(ACCESS_TOKEN_KEY);

const getRefreshToken = () => getStoredValue(REFRESH_TOKEN_KEY);

export const setAuthSession = (tokens: { accessToken: string; refreshToken?: string }) => {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    if (tokens.refreshToken) {
        sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
};

export const clearAuthSession = () => {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const parseApiResponse = async (response: Response) => {
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        const message = payload?.message || payload?.error?.message || response.statusText;
        throw new Error(message || 'An API error occurred');
    }

    if (response.status === 204) {
        return null;
    }

    return payload?.data ?? payload;
};

const refreshAuthSession = async (): Promise<string | null> => {
    if (refreshPromise) {
        return refreshPromise;
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        return null;
    }

    refreshPromise = (async () => {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
            clearAuthSession();
            return null;
        }

        const data = await parseApiResponse(response);
        if (data?.accessToken) {
            setAuthSession({
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
            });
            return data.accessToken;
        }

        clearAuthSession();
        return null;
    })().finally(() => {
        refreshPromise = null;
    });

    return refreshPromise;
};

export const fetchApi = async (path: string, options: RequestInit = {}, allowRetry = true) => {
    const token = getAuthToken();
    const headers = new Headers(options.headers || {});

    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.append('Content-Type', 'application/json');
    }

    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

    if (response.status === 401 && allowRetry) {
        const refreshedToken = await refreshAuthSession();
        if (refreshedToken) {
            return fetchApi(path, options, false);
        }
        // Refresh failed — session is dead, force logout
        clearAuthSession();
        window.dispatchEvent(new CustomEvent('pos:session-expired'));
        throw new Error('Session expired. Please log in again.');
    }

    if (response.status === 403) {
        const payload = await response.json().catch(() => null);
        const message: string = payload?.message || '';
        if (message.toLowerCase().includes('subscription')) {
            window.dispatchEvent(new CustomEvent('pos:subscription-expired', { detail: message }));
        }
        throw new Error(message || 'Access denied');
    }

    return parseApiResponse(response);
};

// --- Auth ---
export const login = async (credentials: { username: string, password: string }) => {
    const data = await fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
    if (data?.accessToken) {
        setAuthSession(data);
    }
    // Gap 3 — A1: Persist capability snapshot for offline auth
    if (data?.capabilitySnapshot) {
        storeCapabilitySnapshot(data.capabilitySnapshot);
    }
    return data as { accessToken: string; refreshToken: string; user: User };
};

export const signup = async (userData: Omit<User, 'id' | 'role'>) => {
    const data = await fetchApi('/auth/signup', { method: 'POST', body: JSON.stringify(userData) });
    if (data?.accessToken) {
        setAuthSession(data);
    }
    return data as { accessToken: string; refreshToken: string; user: User };
};

export const getMe = (): Promise<User> => fetchApi('/auth/me');

export const requestPasswordReset = (email: string): Promise<{ message: string; resetToken?: string }> =>
    fetchApi('/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) });

export const confirmPasswordReset = (resetToken: string, newPassword: string): Promise<{ message: string }> =>
    fetchApi('/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ resetToken, newPassword }) });

export const logout = async () => {
    const refreshToken = getRefreshToken();
    try {
        if (refreshToken) {
            await fetchApi('/auth/logout', {
                method: 'POST',
                body: JSON.stringify({ refreshToken }),
            }, false);
        }
    } finally {
        clearAuthSession();
        clearCapabilitySnapshot();
    }
};

// --- Data Fetching ---
export const getProducts = (): Promise<Product[]> => fetchApi('/products');
export const getCustomers = (): Promise<Customer[]> => fetchApi('/customers');
export const getSales = (): Promise<Sale[]> => fetchApi('/sales');
export const getSuppliers = (): Promise<Supplier[]> => fetchApi('/suppliers');
export const getPurchaseOrders = (): Promise<PurchaseOrder[]> => fetchApi('/purchase-orders');
export const getSupplierInvoices = (): Promise<SupplierInvoice[]> => fetchApi('/supplier-invoices');
export const getQuotations = (): Promise<Quotation[]> => fetchApi('/quotations');
export const getUsers = (): Promise<User[]> => fetchApi('/users');
export const getSettings = (): Promise<Settings> => fetchApi('/settings');
export const getAuditLogs = (): Promise<AuditLog[]> => fetchApi('/audit-logs');
export const getShifts = (): Promise<Shift[]> => fetchApi('/shifts');
export const getTimeClockEvents = (): Promise<TimeClockEvent[]> => fetchApi('/time-clock-events');
export const getPayouts = (): Promise<Expense[]> => fetchApi('/payouts');
export const getLayaways = (): Promise<Layaway[]> => fetchApi('/layaways');
export const getWorkOrders = (): Promise<WorkOrder[]> => fetchApi('/work-orders');
export const getSalesOrders = (): Promise<SalesOrder[]> => fetchApi('/sales-orders');
export const getHeldReceipts = (): Promise<HeldReceipt[]> => fetchApi('/held-receipts');

// --- Data Mutation ---
export const createProduct = (productData: Omit<Product, 'id' | 'stock'>): Promise<Product> => fetchApi('/products', { method: 'POST', body: JSON.stringify(productData) });
export const updateProduct = (product: Product): Promise<Product> => fetchApi(`/products/${product.id}`, { method: 'PUT', body: JSON.stringify(product) });
export const deleteProduct = (productId: string): Promise<void> => fetchApi(`/products/${productId}`, { method: 'DELETE' });
export const importProducts = (products: Omit<Product, 'id'|'stock'>[]): Promise<{ added: number, updated: number }> => fetchApi('/products/import', { method: 'POST', body: JSON.stringify(products) });

export const createCustomer = (customerData: Omit<Customer, 'id' | 'dateAdded' | 'loyaltyPoints'>): Promise<Customer> => fetchApi('/customers', { method: 'POST', body: JSON.stringify(customerData) });
export const updateCustomer = (customer: Customer): Promise<Customer> => fetchApi(`/customers/${customer.id}`, { method: 'PUT', body: JSON.stringify(customer) });
export const deleteCustomer = (customerId: string): Promise<void> => fetchApi(`/customers/${customerId}`, { method: 'DELETE' });

export const createSale = (saleData: SaleData | Sale): Promise<Sale> => fetchApi('/sales', { method: 'POST', body: JSON.stringify(saleData) });
export const createReturn = (returnData: any): Promise<Sale> => fetchApi('/sales/return', { method: 'POST', body: JSON.stringify(returnData) });

export const createSupplier = (supplierData: Omit<Supplier, 'id'>): Promise<Supplier> => fetchApi('/suppliers', { method: 'POST', body: JSON.stringify(supplierData) });

export const createPurchaseOrder = (poData: PurchaseOrderData): Promise<PurchaseOrder> => fetchApi('/purchase-orders', { method: 'POST', body: JSON.stringify(poData) });
export const updatePurchaseOrder = (po: PurchaseOrder): Promise<PurchaseOrder> => fetchApi(`/purchase-orders/${po.id}`, { method: 'PUT', body: JSON.stringify(po) });
export const receivePurchaseOrder = (poId: string, receivedItems: ReceivedPOItem[]): Promise<{ updatedPO: PurchaseOrder, newInvoice: SupplierInvoice }> => fetchApi(`/purchase-orders/${poId}/receive`, { method: 'POST', body: JSON.stringify({ receivedItems }) });
export const createPOFromSO = (soId: string): Promise<{ newPO: PurchaseOrder, updatedSalesOrder: SalesOrder }> => fetchApi(`/sales-orders/${soId}/create-po`, { method: 'POST' });

export const recordSupplierPayment = (invoiceId: string, paymentData: Omit<SupplierPayment, 'id' | 'invoiceId'>): Promise<SupplierInvoice> => fetchApi(`/supplier-invoices/${invoiceId}/payment`, { method: 'POST', body: JSON.stringify(paymentData) });

export const createQuotation = (quoteData: Omit<Quotation, 'id'>): Promise<Quotation> => fetchApi('/quotations', { method: 'POST', body: JSON.stringify(quoteData) });
export const updateQuotation = (quote: Quotation): Promise<Quotation> => fetchApi(`/quotations/${quote.id}`, { method: 'PUT', body: JSON.stringify(quote) });

export const updateUser = (user: User): Promise<User> => fetchApi(`/users/${user.id}`, { method: 'PUT', body: JSON.stringify(user) });
export const createUser = (userData: Omit<User, 'id'>): Promise<User> => fetchApi('/users', { method: 'POST', body: JSON.stringify(userData) });
export const deleteUser = (userId: string): Promise<void> => fetchApi(`/users/${userId}`, { method: 'DELETE' });

export const updateSettings = (settings: Partial<Settings>): Promise<Settings> => fetchApi('/settings', { method: 'POST', body: JSON.stringify(settings) });

export const createShift = (shiftData: Omit<Shift, 'id' | 'salesIds' | 'expenseIds'>): Promise<Shift> => fetchApi('/shifts', { method: 'POST', body: JSON.stringify(shiftData) });
export const updateShift = (shift: Shift): Promise<Shift> => fetchApi(`/shifts/${shift.id}`, { method: 'PUT', body: JSON.stringify(shift) });

export const createPayout = (payoutData: Omit<Expense, 'id'>): Promise<Expense> => fetchApi('/payouts', { method: 'POST', body: JSON.stringify(payoutData) });

export const createTimeClockEvent = (eventData: Omit<TimeClockEvent, 'id'>): Promise<TimeClockEvent> => fetchApi('/time-clock-events', { method: 'POST', body: JSON.stringify(eventData) });
export const updateTimeClockEvent = (event: TimeClockEvent): Promise<TimeClockEvent> => fetchApi(`/time-clock-events/${event.id}`, { method: 'PUT', body: JSON.stringify(event) });
export const deleteTimeClockEvent = (eventId: string): Promise<void> => fetchApi(`/time-clock-events/${eventId}`, { method: 'DELETE' });

export const createLayaway = (data: any): Promise<Layaway> => fetchApi('/layaways', { method: 'POST', body: JSON.stringify(data) });
export const createWorkOrder = (data: any): Promise<WorkOrder> => fetchApi('/work-orders', { method: 'POST', body: JSON.stringify(data) });
export const updateWorkOrder = (wo: WorkOrder): Promise<WorkOrder> => fetchApi(`/work-orders/${wo.id}`, { method: 'PUT', body: JSON.stringify(wo) });

export const createSalesOrder = (data: any): Promise<SalesOrder> => fetchApi('/sales-orders', { method: 'POST', body: JSON.stringify(data) });
export const updateSalesOrder = (so: SalesOrder): Promise<SalesOrder> => fetchApi(`/sales-orders/${so.id}`, { method: 'PUT', body: JSON.stringify(so) });

export const createHeldReceipt = (data: Omit<HeldReceipt, 'id'>): Promise<HeldReceipt> => fetchApi('/held-receipts', { method: 'POST', body: JSON.stringify(data) });
export const deleteHeldReceipt = (id: string): Promise<void> => fetchApi(`/held-receipts/${id}`, { method: 'DELETE' });
