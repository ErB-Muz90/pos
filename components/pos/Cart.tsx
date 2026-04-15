import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartItem, Customer, Settings, Shift, User } from '../../types';
import { calculateCartTotals } from '../../utils/vatCalculator';
import SearchableCustomerDropdown from '../common/SearchableCustomerDropdown';
import { ICONS } from '../../constants';

interface CartProps {
    cartItems: CartItem[];
    customers: Customer[];
    selectedCustomerId: string;
    onCustomerChange: (id: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    updateCartItemDiscount: (productId: string, discount: CartItem['discount'] | undefined) => void;
    removeItem: (productId:string) => void;
    onCharge: (discount: {type: 'percentage' | 'fixed', value: number}) => void;
    isOnline: boolean;
    settings: Settings;
    activeShift: Shift | null;
    onStartShift: (startingFloat: number) => void;
    onEndShiftRequest: () => void;
    onHoldRequest: () => void;
    onLayawayRequest: () => void;
    depositApplied?: number;
    currentUser: User;
}

const FRACTIONAL_UNITS = ['m', 'kg', 'g', 'ltr', 'sq ft'];

// NEW: Moved DiscountEditor outside of the Cart component to prevent re-creation on every render.
const DiscountEditor: React.FC<{
    item: CartItem;
    onApply: (discount: CartItem['discount'] | undefined) => void;
    onClose: () => void;
}> = ({ item, onApply, onClose }) => {
    const [type, setType] = useState<'fixed' | 'percentage'>(item.discount?.type || 'fixed');
    const [value, setValue] = useState<string>(item.discount?.value?.toString() || '');

    const handleChange = (newValue: string, newType?: 'fixed' | 'percentage') => {
        const t = newType ?? type;
        const num = parseFloat(newValue);
        if (!isNaN(num) && num > 0) {
            onApply({ type: t, value: num });
        } else {
            onApply(undefined);
        }
    };

    const handleTypeChange = (newType: 'fixed' | 'percentage') => {
        setType(newType);
        handleChange(value, newType);
    };

    return (
        <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-white/8 bg-[#14161c] p-2 shadow-[0_0_24px_rgba(245,158,11,0.08)]" onClick={e => e.stopPropagation()}>
            <div className="mb-2 flex rounded-lg bg-black/20 p-0.5">
                <button onClick={() => handleTypeChange('fixed')} className={`w-1/2 rounded py-1 text-xs ${type === 'fixed' ? 'bg-amber-500 font-bold text-black' : 'text-white/55'}`}>Fixed</button>
                <button onClick={() => handleTypeChange('percentage')} className={`w-1/2 rounded py-1 text-xs ${type === 'percentage' ? 'bg-amber-500 font-bold text-black' : 'text-white/55'}`}>%</button>
            </div>
            <input
                type="number"
                value={value}
                onChange={(e) => { setValue(e.target.value); handleChange(e.target.value); }}
                className="w-full rounded-md border border-white/8 bg-[#0f1116] p-1 text-sm text-white"
                placeholder={type === 'fixed' ? 'e.g. 100' : 'e.g. 10'}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') onClose(); }}
            />
            <button onClick={onClose} className="mt-2 w-full rounded bg-amber-500 py-1.5 text-xs font-bold text-black">Done</button>
        </div>
    );
};


const Cart = ({ 
    cartItems, 
    customers, 
    selectedCustomerId,
    onCustomerChange,
    updateQuantity, 
    updateCartItemDiscount,
    removeItem, 
    onCharge, 
    isOnline,
    settings,
    activeShift,
    onStartShift,
    onEndShiftRequest,
    onHoldRequest,
    onLayawayRequest,
    currentUser,
    depositApplied = 0,
}: CartProps) => {
    const [cartDiscountValue, setCartDiscountValue] = useState(0);
    const [isFloatPromptOpen, setIsFloatPromptOpen] = useState(false);
    const [startingFloat, setStartingFloat] = useState<number | ''>('');
    const [editingDiscountFor, setEditingDiscountFor] = useState<string | null>(null);

    const discountSettings = settings.discount;
    
    const cartDiscount = {
        type: discountSettings.type,
        value: cartDiscountValue
    };
    
    const { subtotal, lineItemsDiscountAmount, cartDiscountAmount, taxableAmount, tax, total: cartTotal } = useMemo(
        () => calculateCartTotals(cartItems, cartDiscount, settings.tax.vatRate / 100),
        [cartItems, cartDiscount, settings.tax.vatRate]
    );
    const total = cartTotal - depositApplied;

    const handleQuantityChange = (id: string, currentQuantity: number, change: number) => {
        const newQuantity = currentQuantity + change;
        updateQuantity(id, newQuantity);
    };

    const handleQuantityInputChange = (id: string, value: string) => {
        const newQuantity = parseFloat(value);
        if (!isNaN(newQuantity)) {
            updateQuantity(id, newQuantity);
        }
    };
    
    const handleCartDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = parseFloat(e.target.value) || 0;
        value = Math.max(0, Math.min(discountSettings.maxValue, value));
        setCartDiscountValue(value);
    };

    const handleToggleClick = () => {
        if (activeShift) {
            onEndShiftRequest();
        } else {
            setIsFloatPromptOpen(true);
        }
    };

    const handleConfirmStartShift = (e: React.FormEvent) => {
        e.preventDefault();
        if (typeof startingFloat === 'number' && startingFloat >= 0) {
            onStartShift(startingFloat);
            setIsFloatPromptOpen(false);
            setStartingFloat('');
        }
    };

    return (
        <div className="relative flex min-h-0 flex-1 flex-col bg-[#0b0b0d] text-white">
            <AnimatePresence>
                {isFloatPromptOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 flex flex-col items-center justify-center space-y-4 bg-black/70 p-6 backdrop-blur-xl"
                    >
                        <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <h4 className="text-lg font-bold text-white">Enter Starting Float</h4>
                         <form onSubmit={handleConfirmStartShift} className="w-full space-y-4">
                            <input 
                                type="number" 
                                value={startingFloat} 
                                onChange={e => setStartingFloat(e.target.value === '' ? '' : Number(e.target.value))} 
                                className="block w-full rounded-xl border border-white/8 bg-[#121419] p-3 text-center text-xl font-bold text-white focus:border-amber-500/40 focus:outline-none"
                                placeholder="e.g., 5000"
                                autoFocus
                            />
                            <div className="flex space-x-2">
                                <motion.button type="button" onClick={() => setIsFloatPromptOpen(false)} whileTap={{ scale: 0.95 }} className="flex-1 rounded-xl bg-[#17191f] py-2 font-bold text-white shadow-[8px_8px_20px_rgba(0,0,0,0.44),-4px_-4px_12px_rgba(255,255,255,0.02)]">Cancel</motion.button>
                                <motion.button type="submit" whileTap={{ scale: 0.95 }} className="flex-1 rounded-xl bg-amber-500 py-2 font-bold text-black shadow-[0_0_20px_rgba(245,158,11,0.24)]">Confirm</motion.button>
                            </div>
                         </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="border-b border-white/8 bg-[#111317] p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-white">Shift Status</h3>
                        <p className={`text-sm font-bold ${activeShift ? 'text-emerald-400' : 'text-white/45'}`}>
                            {activeShift ? `Active (${new Date(activeShift.startTime).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit', timeZone: 'Africa/Nairobi'})})` : 'Inactive'}
                        </p>
                    </div>
                    <button 
                        onClick={handleToggleClick} 
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${activeShift ? 'bg-amber-500' : 'bg-white/15'}`}
                        aria-label={activeShift ? "End Shift" : "Start Shift"}
                    >
                        <motion.span 
                            layout
                            transition={{type: "spring", stiffness: 700, damping: 30}}
                            className={`inline-block h-4 w-4 rounded-full bg-white transform transition-transform ${activeShift ? 'translate-x-6' : 'translate-x-1'}`} 
                        />
                    </button>
                </div>
            </div>

            <div className="border-b border-white/8 bg-[#0f1115] p-4">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-white">Current Sale</h2>
                    {cartItems.length > 0 && (
                        <span className="rounded-full bg-white/8 px-2.5 py-1 text-sm font-bold text-white/70">
                            {cartItems.reduce((total, item) => total + item.quantity, 0)} items
                        </span>
                    )}
                </div>
                <SearchableCustomerDropdown
                    customers={customers}
                    selectedCustomerId={selectedCustomerId}
                    onCustomerChange={onCustomerChange}
                    disabled={!activeShift}
                />
            </div>

            <div className="flex-grow overflow-y-auto">
                {cartItems.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-white/40">
                        <p>Cart is empty. Add products to start.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-white/6">
                        <AnimatePresence>
                            {cartItems.map(item => {
                                const allowFractions = FRACTIONAL_UNITS.includes(item.unitOfMeasure);
                                return (
                                <motion.li 
                                    key={item.id} 
                                    layout
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 50 }}
                                    className="flex space-x-3 bg-[#0b0b0d] p-4"
                                >
                                    <div className="flex-grow">
                                        <p className="text-sm font-bold text-white">{item.name}</p>
                                        <p className="text-xs text-white/45">Ksh {item.price.toFixed(2)} / {item.unitOfMeasure}</p>
                                        {item.discount && (
                                            <p className="text-xs font-semibold text-amber-300">
                                                -{item.discount.type === 'fixed' ? `Ksh ${item.discount.value.toFixed(2)}` : `${item.discount.value}%`} off
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        {allowFractions ? (
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                                                step="0.01"
                                                className="w-20 rounded-md border border-white/8 bg-[#121419] p-1 text-center font-bold text-white"
                                            />
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleQuantityChange(item.id, item.quantity, -1)} className="h-6 w-6 rounded-full bg-[#17191f] text-white hover:text-amber-200">-</motion.button>
                                                <span className="w-6 text-center font-bold text-white">{item.quantity}</span>
                                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleQuantityChange(item.id, item.quantity, 1)} className="h-6 w-6 rounded-full bg-[#17191f] text-white hover:text-amber-200">+</motion.button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-20 text-right">
                                        {item.discount ? (
                                            <>
                                                <p className="text-xs line-through text-white/35">Ksh {(item.price * item.quantity).toFixed(2)}</p>
                                                <p className="font-bold text-amber-300">
                                                    Ksh {(item.discount.type === 'fixed'
                                                        ? Math.max(0, item.price * item.quantity - item.discount.value)
                                                        : item.price * item.quantity * (1 - item.discount.value / 100)
                                                    ).toFixed(2)}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="font-bold text-white">Ksh {(item.price * item.quantity).toFixed(2)}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-center justify-center space-y-1">
                                        <div className="relative">
                                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditingDiscountFor(editingDiscountFor === item.id ? null : item.id)} className={`rounded-full p-1 ${item.discount ? 'text-amber-300' : 'text-white/45 hover:text-amber-300'}`}>
                                                {React.cloneElement(ICONS.discount, { className: 'h-5 w-5' })}
                                            </motion.button>
                                            {editingDiscountFor === item.id && (
                                                <DiscountEditor
                                                    item={item}
                                                    onApply={(discount) => updateCartItemDiscount(item.id, discount)}
                                                    onClose={() => setEditingDiscountFor(null)}
                                                />
                                            )}
                                        </div>
                                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeItem(item.id)} className="text-danger/70 hover:text-danger">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </motion.button>
                                    </div>
                                </motion.li>
                            )})}
                        </AnimatePresence>
                    </ul>
                )}
            </div>
            
            <div className="space-y-2 border-t border-white/8 bg-[#111317] p-4">
                <div className="flex justify-between text-sm">
                    <span className="text-white/55">Gross Subtotal</span>
                    <span className="font-bold text-white">Ksh {subtotal.toFixed(2)}</span>
                </div>

                {lineItemsDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-danger">
                      <span>Item Discounts</span>
                      <span>- Ksh {lineItemsDiscountAmount.toFixed(2)}</span>
                  </div>
                )}

                {discountSettings.enabled && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-white/55">Cart Discount ({cartDiscount.type === 'percentage' ? '%' : 'KES'})</span>
                        <input 
                          type="number"
                          value={cartDiscountValue}
                          onChange={handleCartDiscountChange}
                          max={discountSettings.maxValue}
                          className="w-20 rounded-md border border-white/8 bg-[#0f1116] px-2 py-1 text-right font-bold text-white"
                        />
                    </div>
                )}

                {cartDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-danger">
                      <span>Cart Discount Amount</span>
                      <span>- Ksh {cartDiscountAmount.toFixed(2)}</span>
                  </div>
                )}

                 <div className="flex justify-between text-sm">
                    <span className="text-white/55">Taxable Amount</span>
                    <span className="font-bold text-white">Ksh {taxableAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-white/55">VAT ({settings.tax.vatRate}%)</span>
                    <span className="font-bold text-white">Ksh {tax.toFixed(2)}</span>
                </div>
                 {depositApplied > 0 && (
                    <div className="flex justify-between text-sm text-accent dark:text-dark-accent">
                        <span>Deposit Paid</span>
                        <span>- Ksh {depositApplied.toFixed(2)}</span>
                    </div>
                )}
                <div className="rounded-2xl border border-amber-500/15 bg-[linear-gradient(145deg,#181b22,#101216)] p-4 text-white shadow-[0_0_24px_rgba(245,158,11,0.10)]">
                    <div className="flex justify-between text-lg">
                        <span className="font-bold">Total</span>
                        <span className="font-bold text-amber-300">Ksh {total.toFixed(2)}</span>
                    </div>
                </div>
                 <div className="flex gap-2 mt-4">
                     <motion.button 
                        onClick={onHoldRequest}
                        disabled={cartItems.length === 0 || !activeShift}
                        whileTap={{ scale: 0.98 }}
                        className="flex flex-1 items-center justify-center rounded-xl bg-[#17191f] py-3 text-lg font-bold text-white shadow-[8px_8px_20px_rgba(0,0,0,0.44),-4px_-4px_12px_rgba(255,255,255,0.02)] disabled:bg-slate-700 disabled:text-white/40"
                     >
                        Hold
                     </motion.button>
                     <motion.button 
                        onClick={onLayawayRequest}
                        disabled={cartItems.length === 0 || !activeShift}
                        whileTap={{ scale: 0.98 }}
                        className="flex flex-1 items-center justify-center rounded-xl bg-[#17191f] py-3 text-lg font-bold text-white shadow-[8px_8px_20px_rgba(0,0,0,0.44),-4px_-4px_12px_rgba(255,255,255,0.02)] disabled:bg-slate-700 disabled:text-white/40"
                     >
                        Layaway
                     </motion.button>
                     <motion.button 
                        onClick={() => onCharge(cartDiscount)}
                        disabled={cartItems.length === 0 || !activeShift}
                        whileTap={{ scale: 0.98 }}
                        className="flex flex-1 items-center justify-center rounded-xl bg-amber-500 py-3 text-lg font-bold text-black shadow-[0_0_20px_rgba(245,158,11,0.24)] disabled:bg-slate-700 disabled:text-white/40"
                     >
                         Charge
                         {!isOnline && <span className="text-xs ml-2">(Offline)</span>}
                     </motion.button>
                </div>
            </div>
        </div>
    );
};

export default Cart;
