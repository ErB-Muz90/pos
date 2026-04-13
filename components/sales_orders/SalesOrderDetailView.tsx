import React, { useState, useRef } from 'react';
import { SalesOrder, Settings, Sale, User, Payment, ToastData } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import SalesOrderDocument from './SalesOrderDocument';
import { SaleSuccessView } from '../pos/SaleSuccessView';

interface SalesOrderDetailViewProps {
    salesOrder: SalesOrder;
    onBack: () => void;
    onCancelRequest: (salesOrder: SalesOrder) => void;
    onUpdate: (salesOrder: SalesOrder) => void;
    settings: Settings;
    onPushToPOSRequest: (salesOrder: SalesOrder) => void;
}

const getStatusIndex = (status: SalesOrder['status']): number => {
    const order = ['Pending', 'Ordered', 'Received', 'Ready', 'Completed'];
    const index = order.indexOf(status);
    return index !== -1 ? index : (status === 'Partially Received' ? 2 : -1);
};

const ProgressBar: React.FC<{ currentStatus: SalesOrder['status'] }> = ({ currentStatus }) => {
    const statusSteps = ['Pending', 'Ordered', 'Received', 'Ready', 'Completed'];
    const currentIndex = getStatusIndex(currentStatus);

    if (currentStatus === 'Cancelled' || currentStatus === 'Draft') {
        return (
            <div className="text-center p-4 bg-muted dark:bg-dark-muted/50 rounded-md">
                <p className={`font-bold ${currentStatus === 'Cancelled' ? 'text-danger' : 'text-foreground-muted'}`}>
                    Order {currentStatus}
                </p>
            </div>
        );
    }
    
    return (
        <div className="flex items-center w-full">
            {statusSteps.map((step, index) => {
                const isCompleted = index < currentIndex;
                const isActive = index === currentIndex || (currentStatus === 'Partially Received' && step === 'Received');
                
                return (
                    <React.Fragment key={step}>
                        <div className="flex flex-col items-center text-center flex-shrink-0 w-24 relative">
                            <motion.div
                                animate={{ scale: isActive ? 1.1 : 1 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-colors duration-300
                                    ${isCompleted ? 'bg-success' : isActive ? 'bg-primary animate-pulse' : 'bg-muted dark:bg-dark-muted'}`}
                            >
                                {isCompleted ? '✓' : ''}
                            </motion.div>
                            <p className={`mt-2 text-xs font-semibold transition-colors duration-300
                                ${isActive ? 'text-primary dark:text-dark-primary' : isCompleted ? 'text-foreground dark:text-dark-foreground' : 'text-foreground-muted'}`}>
                                {step}
                            </p>
                        </div>
                        {index < statusSteps.length - 1 && (
                            <div className={`flex-grow h-1 transition-colors duration-300 ${isCompleted ? 'bg-success' : 'bg-muted dark:bg-dark-muted'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const SalesOrderDetailView: React.FC<SalesOrderDetailViewProps> = ({ salesOrder, onBack, onCancelRequest, onUpdate, onPushToPOSRequest }) => {
    
    const nextStatus: Partial<Record<SalesOrder['status'], SalesOrder['status']>> = {
        Pending: 'Ordered',
        Ordered: 'Received',
        'Partially Received': 'Received',
        Received: 'Ready',
        Ready: 'Completed'
    };
    
    const handleUpdateStatus = () => {
        const next = nextStatus[salesOrder.status];
        if (next) {
            onUpdate({ ...salesOrder, status: next });
        }
    };
    
    return (
        <div className="p-4 md:p-6 bg-muted dark:bg-dark-muted h-full flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card dark:bg-dark-card w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[95vh]"
            >
                <header className="p-4 border-b border-border dark:border-dark-border flex-shrink-0 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-foreground dark:text-dark-foreground">Sales Order Details</h2>
                        <p className="text-sm font-mono text-foreground-muted">{salesOrder.id}</p>
                    </div>
                    <button onClick={onBack} className="text-2xl text-foreground-muted hover:text-foreground">&times;</button>
                </header>

                <main className="p-6 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><strong className="block text-foreground-muted">Customer</strong>{salesOrder.customerName}</div>
                        <div><strong className="block text-foreground-muted">Order Date</strong>{new Date(salesOrder.createdDate).toLocaleDateString()}</div>
                        <div><strong className="block text-foreground-muted">Expected By</strong>{salesOrder.deliveryDate ? new Date(salesOrder.deliveryDate).toLocaleDateString() : 'N/A'}</div>
                        <div><strong className="block text-foreground-muted">Created By</strong>{salesOrder.cashierName}</div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold uppercase text-foreground-muted mb-2">Order Progress</h3>
                        <ProgressBar currentStatus={salesOrder.status} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        <div className="md:col-span-3">
                            <h3 className="text-sm font-bold uppercase text-foreground-muted mb-2">Items</h3>
                            <ul className="divide-y divide-border dark:divide-dark-border border border-border dark:border-dark-border rounded-lg">
                                {salesOrder.items.map(item => (
                                   <li key={item.id} className="p-3 flex justify-between items-center text-sm">
                                       <div>
                                           <p className="font-semibold">{item.description}</p>
                                           <p className="text-xs text-foreground-muted">{item.quantity} x {item.unitPrice.toFixed(2)}</p>
                                       </div>
                                       <p className="font-mono">{(item.quantity * item.unitPrice).toFixed(2)}</p>
                                   </li>
                                ))}
                            </ul>
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            <h3 className="text-sm font-bold uppercase text-foreground-muted">Financials</h3>
                             <div className="p-4 bg-muted dark:bg-dark-muted rounded-lg space-y-1 text-sm">
                                <div className="flex justify-between"><span className="text-foreground-muted">Subtotal (excl. VAT):</span> <span className="font-mono">{(salesOrder.total / 1.16).toFixed(2)}</span></div>
                                <div className="flex justify-between"><span className="text-foreground-muted">VAT (16%):</span> <span className="font-mono">{(salesOrder.total - salesOrder.total / 1.16).toFixed(2)}</span></div>
                                <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>Total:</span> <span className="font-mono">{salesOrder.total.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span className="text-foreground-muted">Deposit Paid:</span> <span className="font-mono">{salesOrder.deposit.toFixed(2)}</span></div>
                                <div className="flex justify-between font-bold text-lg text-danger pt-2 mt-2"><span>Balance Due:</span> <span className="font-mono">{salesOrder.balance.toFixed(2)}</span></div>
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="p-4 border-t border-border dark:border-dark-border flex-shrink-0 flex justify-end items-center gap-3">
                    {salesOrder.status !== 'Completed' && salesOrder.status !== 'Cancelled' && (
                        <>
                            {nextStatus[salesOrder.status] && (
                                <motion.button onClick={handleUpdateStatus} whileTap={{scale: 0.95}} className="bg-primary text-primary-content font-bold px-4 py-2 rounded-lg">
                                    Mark as {nextStatus[salesOrder.status]}
                                </motion.button>
                            )}
                             {salesOrder.balance > 0 && (
                                <motion.button onClick={() => onPushToPOSRequest(salesOrder)} whileTap={{scale: 0.95}} className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg">
                                    Pay Balance
                                </motion.button>
                            )}
                            <motion.button onClick={() => onCancelRequest(salesOrder)} whileTap={{scale: 0.95}} className="bg-danger text-white font-bold px-4 py-2 rounded-lg">
                                Cancel Order
                            </motion.button>
                        </>
                    )}
                </footer>
            </motion.div>
        </div>
    );
};

export default SalesOrderDetailView;