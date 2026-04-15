import React, { useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Product, CartItem, Customer, Sale, User, SaleData, Settings, Shift, Expense, WorkOrder, SalesOrder, ToastData, SupplierPayment, BankDeposit, View } from '../../types';
import ProductGrid from './ProductGrid';
import Cart from './Cart';
import PaymentModal from './PaymentModal';
import { SaleSuccessView } from './SaleSuccessView';
import EndShiftModal from './EndShiftModal';
import ZReportView from './ZReportView';
import { ModernStatCard } from '../common/ModernUI';

interface PosViewProps {
    products: Product[];
    cart: CartItem[];
    customers: Customer[];
    selectedCustomerId: string;
    onCustomerChange: (id: string) => void;
    addToCart: (product: Product) => void;
    updateCartItemQuantity: (productId: string, quantity: number) => void;
    // FIX: Add missing updateCartItemDiscount prop to the interface.
    updateCartItemDiscount: (productId: string, discount: CartItem['discount'] | undefined) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    completeSale: (saleData: SaleData) => Promise<Sale>;
    isOnline: boolean;
    currentUser: User;
    settings: Settings;
    sales: Sale[];
    payouts: Expense[];
    supplierPayments: SupplierPayment[];
    bankDeposits: BankDeposit[];
    activeShift: Shift | null;
    onStartShift: (startingFloat: number) => void;
    onEndShiftRequest: () => void;
    isEndingShift: boolean;
    onConfirmEndShift: (actualCash: number, notes: string, bankDepositAmount?: number, bankDepositReceiptNo?: string) => void;
    onCancelEndShift: () => void;
    shiftReportToShow: Shift | null;
    onCloseShiftReport: () => void;
    // FIX: Add missing onEmailReceiptRequest to props to satisfy SaleSuccessView.
    onEmailReceiptRequest: (saleId: string, customerId: string) => void;
    onWhatsAppReceiptRequest: (saleId: string, customerId: string) => void;
    onHoldRequest: () => void;
    // FIX: Add missing onLayawayRequest prop to satisfy CartProps.
    onLayawayRequest: () => void;
    workOrders: WorkOrder[];
    originatingWorkOrderId: string | null;
    salesOrders: SalesOrder[];
    originatingSalesOrderId: string | null;
    showToast: (message: string, type: ToastData['type']) => void;
    onNavigate?: (view: View) => void;
}

const MotionButton = motion.button;
const MotionSpan = motion.span;
const MotionDiv = motion.div;

const PosView = ({ 
    products, 
    cart, 
    customers, 
    selectedCustomerId,
    onCustomerChange,
    addToCart, 
    updateCartItemQuantity, 
    updateCartItemDiscount,
    removeFromCart,
    clearCart,
    completeSale,
    isOnline,
    currentUser,
    settings,
    sales,
    payouts,
    supplierPayments,
    bankDeposits,
    activeShift,
    onStartShift,
    onEndShiftRequest,
    isEndingShift,
    onConfirmEndShift,
    onCancelEndShift,
    shiftReportToShow,
    onCloseShiftReport,
    onEmailReceiptRequest,
    onWhatsAppReceiptRequest,
    onHoldRequest,
    // FIX: Destructure onLayawayRequest to pass it down to Cart component.
    onLayawayRequest,
    workOrders,
    originatingWorkOrderId,
    salesOrders,
    originatingSalesOrderId,
    showToast,
    onNavigate,
}: PosViewProps) => {
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [chargeDiscount, setChargeDiscount] = useState<{type: 'percentage' | 'fixed', value: number}>({type: 'percentage', value: 0});
    const [lastSale, setLastSale] = useState<Sale | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const [shouldAutoPrint, setShouldAutoPrint] = useState(false);

    const selectedCustomer = useMemo(() => {
        return customers.find(c => c.id === selectedCustomerId);
    }, [customers, selectedCustomerId]);

    const depositApplied = useMemo(() => {
        // If the cart item is a balance payment, its price is already the balance due.
        // If the cart item is a deposit payment, there's no deposit applied yet.
        // If it's a regular sale, there is no deposit.
        // Therefore, for cart calculation purposes, this should always be 0.
        // The actual `depositApplied` for receipt generation is handled during sale completion.
        return 0;
    }, []);


    const handleCharge = (discount: {type: 'percentage' | 'fixed', value: number}) => {
        if (cart.length === 0) return;
        setChargeDiscount(discount);
        setPaymentModalOpen(true);
    };

    const handleCompleteSale = async (saleData: SaleData, options?: { autoPrint?: boolean }) => {
        try {
            const newSale = await completeSale(saleData);
            setLastSale(newSale);
            if (options?.autoPrint) {
                setShouldAutoPrint(true);
            }
        } catch (error) {
            // The parent App component shows the error toast. We just need to handle UI state.
            console.error("Sale completion failed in PosView:", error);
        } finally {
            // This robustly ensures the payment modal always closes, whether the sale
            // succeeded or failed, preventing the UI from getting stuck.
            setPaymentModalOpen(false);
            setIsCartOpen(false);
        }
    };

    const handleNewSale = useCallback(() => {
        clearCart();
        setLastSale(null);
        setShouldAutoPrint(false);
    }, [clearCart]);

    const isPosActive = !!activeShift && !isEndingShift && !shiftReportToShow;

    const posStats = useMemo(() => {
        const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartValue = cart.reduce((sum, item) => {
            const lineSubtotal = item.price * item.quantity;
            if (!item.discount) return sum + lineSubtotal;
            const discountAmount = item.discount.type === 'percentage'
                ? lineSubtotal * (item.discount.value / 100)
                : item.discount.value;
            return sum + Math.max(0, lineSubtotal - discountAmount);
        }, 0);

        const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });
        const todaySales = sales.filter((sale) => new Date(sale.date).toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' }) === todayKey);
        const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);

        return {
            cartItems,
            cartValue,
            todayRevenue,
            availableProducts: products.filter((product) => product.productType === 'Inventory' ? product.stock > 0 : true).length,
        };
    }, [cart, products, sales]);

    const posIcons = {
        cart: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l2.4 10.2A2 2 0 0 0 9.35 16H18a2 2 0 0 0 1.94-1.5L22 7H7" /></svg>,
        cash: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg>,
        shelf: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" /></svg>,
        shift: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" /></svg>,
    };

    const mobilePrimaryNav = [
        { label: 'POS', view: View.POS, icon: posIcons.cart },
        { label: 'Inventory', view: View.Inventory, icon: posIcons.shelf },
        { label: 'Sales', view: View.SalesHistory, icon: posIcons.cash },
        { label: 'Reports', view: View.ProfitReport, icon: posIcons.shift },
    ] as const;

    const moreNavItems = [
        { label: 'Dashboard', view: View.Dashboard },
        { label: 'Customers', view: View.Customers },
        { label: 'Suppliers', view: View.Suppliers },
        { label: 'Accounts Payable', view: View.AccountsPayable },
        { label: 'Purchase Orders', view: View.Purchases },
        { label: 'Sales Orders', view: View.SalesOrderList },
        { label: 'Quotations', view: View.Quotations },
        { label: 'Work Orders', view: View.WorkOrderList },
        { label: 'Layaways', view: View.LayawayList },
        { label: 'Held Receipts', view: View.HeldReceipts },
        { label: 'Returns', view: View.ReturnReceipt },
        { label: 'Damaged Inventory', view: View.Inventory },
        { label: 'Staff', view: View.Staff },
        { label: 'Shifts', view: View.TimeSheets },
        { label: 'Accounts & Finance', view: View.Accounts },
        { label: 'Fiscal Period Report', view: View.FiscalPeriodReport },
        { label: 'Tax Report', view: View.TaxReport },
    ] as const;

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        if (window.innerWidth >= 768) return;
        if (cart.length > 0) {
            setIsCartOpen(true);
        }
    }, [cart.length]);

    const handleNavigate = (view: View) => {
        setIsMoreOpen(false);
        setIsCartOpen(false);
        onNavigate?.(view);
    };

    if (lastSale) {
        return <SaleSuccessView 
            sale={lastSale} 
            onNewSale={handleNewSale} 
            currentUser={currentUser} 
            settings={settings} 
            onEmailReceiptRequest={onEmailReceiptRequest}
            onWhatsAppReceiptRequest={onWhatsAppReceiptRequest}
            shouldAutoPrint={shouldAutoPrint}
            onAutoPrintDone={() => setShouldAutoPrint(false)}
            showToast={showToast}
        />;
    }
    
    const cartProps = {
        cartItems: cart,
        customers,
        selectedCustomerId,
        onCustomerChange,
        updateQuantity: updateCartItemQuantity,
        updateCartItemDiscount,
        removeItem: removeFromCart,
        onCharge: handleCharge,
        isOnline,
        settings,
        activeShift,
        onStartShift,
        onEndShiftRequest,
        onHoldRequest,
        onLayawayRequest,
// FIX: Add missing 'currentUser' prop required by the 'Cart' component.
        currentUser,
        depositApplied,
    };

    return (
        <div className="relative h-[100dvh] min-h-0 overflow-hidden bg-[#09090b] md:h-full md:pb-0">
            <AnimatePresence>
                 {isEndingShift && activeShift && (
                    <EndShiftModal
                        activeShift={activeShift}
                        sales={sales}
                        expenses={payouts}
                        supplierPayments={supplierPayments}
                        bankDeposits={bankDeposits}
                        settings={settings}
                        onConfirmEndShift={onConfirmEndShift}
                        onCancel={onCancelEndShift}
                    />
                )}
                {shiftReportToShow && (
                     <ZReportView
                        shift={shiftReportToShow}
                        sales={sales}
                        expenses={payouts}
                        supplierPayments={supplierPayments}
                        bankDeposits={bankDeposits}
                        onClose={onCloseShiftReport}
                        settings={settings}
                     />
                )}
            </AnimatePresence>

            <div className="flex h-full min-h-0 flex-col">
                <div className="sticky top-0 z-20 border-b border-white/8 bg-[#0f1115] px-4 py-3 md:hidden">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h1 className="text-lg font-bold text-white">Banduka POS</h1>
                            <p className="text-xs text-white/45">{settings.businessInfo.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${activeShift ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/8 text-white/55'}`}>
                                {activeShift ? 'Active' : 'Inactive'}
                            </span>
                            <button
                                type="button"
                                onClick={activeShift ? onEndShiftRequest : () => setIsCartOpen(true)}
                                className={`min-h-[44px] rounded-xl px-3 text-xs font-bold touch-manipulation ${activeShift ? 'bg-[#17191f] text-white' : 'bg-amber-500 text-black'}`}
                            >
                                {activeShift ? 'End Shift' : 'Start Shift in Cart'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="hidden border-b border-white/8 bg-[#0f1115] px-4 py-4 md:block md:px-6">
                    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="mb-2 inline-flex rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                                Point Of Sale
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-white">Checkout Workspace</h1>
                            <p className="mt-1 text-sm text-white/50">
                                {settings.businessInfo.name} • {activeShift ? `Shift active for ${currentUser.name}` : 'Start a shift to begin selling'}
                            </p>
                        </div>
                        <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${isPosActive ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
                            {isPosActive ? 'POS Active' : 'Shift Required'}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <ModernStatCard title="Cart Items" value={posStats.cartItems} subtitle="Total quantity in current cart" icon={posIcons.cart} accent="violet" />
                        <ModernStatCard title="Cart Value" value={`${settings.businessInfo.currency} ${posStats.cartValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subtitle="Current checkout subtotal after line discounts" icon={posIcons.cash} accent="emerald" />
                        <ModernStatCard title="Today's Revenue" value={`${settings.businessInfo.currency} ${posStats.todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subtitle="Completed sales posted today" icon={posIcons.shift} accent="blue" />
                        <ModernStatCard title="Sellable Products" value={posStats.availableProducts} subtitle="Items currently available for checkout" icon={posIcons.shelf} accent="amber" />
                    </div>
                </div>

                <div className="relative flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[1fr_auto] md:overflow-hidden">
                    {/* Product Grid Area: Main column, now scrolls on all screen sizes */}
                    <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-28 transition-opacity duration-300 md:p-6 md:pb-6 ${!isPosActive ? 'pointer-events-none opacity-20' : 'opacity-100'}`}>
                        <div className="flex min-h-full flex-col rounded-[28px] border border-white/6 bg-[#0f1115] p-3 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)] md:min-h-0 md:p-4">
                            <ProductGrid products={products} onAddToCart={addToCart} settings={settings} />
                        </div>
                    </div>

                    {/* --- Cart Area --- */}

                    {/* Desktop Cart (visible on medium screens and up) */}
                    <div className={`hidden min-h-0 flex-col border-l border-white/6 bg-[#0b0b0d] shadow-lg transition-opacity duration-300 md:flex md:w-96 ${!activeShift ? 'opacity-50' : 'opacity-100'}`}>
                        <Cart {...cartProps} />
                    </div>
                </div>
            </div>

            <div className="fixed bottom-20 right-4 z-30 md:hidden">
                <MotionButton
                    onClick={() => setIsCartOpen(true)}
                    whileTap={{ scale: 0.95 }}
                    className="flex min-h-[56px] min-w-[56px] items-center justify-center rounded-full bg-amber-500 p-4 text-black shadow-[0_0_20px_rgba(245,158,11,0.24)] transition-shadow touch-manipulation"
                    aria-label={`View Cart (${cart.length} items)`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    {cart.length > 0 && (
                        <MotionSpan
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 bg-danger text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white dark:border-dark-background">
                            {cart.reduce((sum, item) => sum + item.quantity, 0)}
                        </MotionSpan>
                    )}
                </MotionButton>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/8 bg-[#11131c]/95 px-2 py-2 backdrop-blur-xl md:hidden">
                <div className="grid grid-cols-5 gap-1">
                    {mobilePrimaryNav.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => handleNavigate(item.view)}
                            className="flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl text-white touch-manipulation"
                        >
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${item.view === View.POS ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white' : 'text-white/60'}`}>
                                {item.icon}
                            </span>
                            <span className={`text-[11px] leading-none text-white/75 max-[480px]:hidden ${item.view === View.POS ? 'font-semibold text-white' : ''}`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => setIsMoreOpen(true)}
                        className="flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl text-white touch-manipulation"
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full text-white/60">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
                        </span>
                        <span className="text-[11px] leading-none text-white/75 max-[480px]:hidden">More</span>
                    </button>
                </div>
            </div>
            
            {/* Mobile Cart Panel (visible on small screens when isCartOpen is true) */}
            <AnimatePresence>
                {isCartOpen && (
                    <div className="md:hidden fixed inset-0 z-30" aria-modal="true" role="dialog">
                        {/* Backdrop */}
                        <MotionDiv
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 bg-black/60"
                            onClick={() => setIsCartOpen(false)}
                        />
                        
                        {/* Panel */}
                        <MotionDiv
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                            className="absolute bottom-0 left-0 right-0 flex h-auto max-h-[90vh] flex-col rounded-t-2xl bg-[#0b0b0d]"
                        >
                            {/* Dragger handle to close */}
                            <div className="p-4 flex-shrink-0 cursor-grab" onPointerDown={() => setIsCartOpen(false)}>
                                <div className="mx-auto block h-1.5 w-12 rounded-full bg-white/15"></div>
                            </div>
                            
                            <Cart {...cartProps} />
                        </MotionDiv>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isMoreOpen && (
                    <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
                        <MotionDiv
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60"
                            onClick={() => setIsMoreOpen(false)}
                        />
                        <MotionDiv
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                            className="absolute bottom-0 left-0 right-0 max-h-[75vh] rounded-t-3xl border-t border-white/8 bg-[#0f1115] px-4 pb-6 pt-4"
                        >
                            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/15" />
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">More</h2>
                                <button type="button" onClick={() => setIsMoreOpen(false)} className="rounded-full p-2 text-white/60">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="overflow-y-auto">
                                <div className="space-y-2">
                                    {moreNavItems.map((item) => (
                                        <button
                                            key={item.label}
                                            type="button"
                                            onClick={() => handleNavigate(item.view)}
                                            className="flex min-h-[44px] w-full items-center rounded-2xl border border-white/6 bg-[#15181f] px-4 py-3 text-left text-sm font-medium text-white/80 touch-manipulation"
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </MotionDiv>
                    </div>
                )}
            </AnimatePresence>
            
            <AnimatePresence>
                {isPaymentModalOpen && selectedCustomer && isPosActive && (
                    <PaymentModal 
                        cartItems={cart}
                        discount={chargeDiscount}
                        onClose={() => setPaymentModalOpen(false)}
                        onCompleteSale={handleCompleteSale}
                        customer={selectedCustomer}
                        settings={settings}
                        depositApplied={depositApplied}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default PosView;
