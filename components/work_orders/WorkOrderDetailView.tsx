

import React, { useState, useRef } from 'react';
import { WorkOrder, User, Settings, Sale, WorkOrderMaterial } from '../../types';
import { motion } from 'framer-motion';
import JobCardDocument from './JobCardDocument';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface WorkOrderDetailViewProps {
    workOrder: WorkOrder;
    materials: WorkOrderMaterial[];
    users: User[];
    sales: Sale[];
    settings: Settings;
    onBack: () => void;
    onUpdate: (workOrder: WorkOrder) => void;
    onPushToPOS: (workOrder: WorkOrder) => void;
}

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 font-semibold text-sm relative transition-colors ${
            isActive 
            ? 'text-primary dark:text-dark-primary' 
            : 'text-foreground-muted dark:text-dark-foreground-muted'
        }`}
    >
        {label}
        {isActive && (
            <motion.div layoutId="wo-detail-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-dark-primary" />
        )}
    </button>
);

// Helper function to wait for all images inside an element to load
const waitForImagesToLoad = (element: HTMLElement): Promise<void[]> => {
    const images = Array.from(element.getElementsByTagName('img'));
    const promises = images.map(img => {
        return new Promise<void>((resolve) => {
            if (img.complete && img.naturalHeight !== 0) {
                resolve();
            } else {
                img.onload = () => resolve();
                img.onerror = () => {
                    console.warn(`Could not load image for PDF generation: ${img.src}`);
                    resolve(); // Resolve anyway to not block PDF generation
                };
            }
        });
    });
    return Promise.all(promises);
};


export const WorkOrderDetailView: React.FC<WorkOrderDetailViewProps> = ({ workOrder, materials, users, sales, settings, onBack, onUpdate, onPushToPOS }) => {
    const [status, setStatus] = useState(workOrder.status);
    const [assignedTo, setAssignedTo] = useState(workOrder.assignedTo || '');
    const [activeTab, setActiveTab] = useState<'details' | 'job_card'>('details');
    const pdfRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const isFullyPaid = workOrder.balanceDue <= 0;
    const hasChanges = status !== workOrder.status || assignedTo !== (workOrder.assignedTo || '');
    
    const linkedSales = sales.filter(s => s.workOrderId === workOrder.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const handleStatusChange = (newStatus: WorkOrder['status']) => {
        if (newStatus === 'Completed' && !isFullyPaid) {
            alert('This work order has an outstanding balance and cannot be marked as completed.');
            return; // Explicitly prevent the state from being updated
        }
        setStatus(newStatus);
    };

    const handleUpdate = () => {
        // Add a final guard here before propagating the update
        if (status === 'Completed' && workOrder.balanceDue > 0) {
            alert("Cannot save as 'Completed' while a balance is due. Please clear the balance first.");
            setStatus(workOrder.status); // Revert local state to the prop's state
            return;
        }
        const updatedWorkOrder: WorkOrder = {
            ...workOrder,
            status,
            assignedTo: assignedTo || undefined,
            updatedAt: new Date().toISOString(),
        };
        onUpdate(updatedWorkOrder);
    };

    const handlePrint = () => {
        setActiveTab('job_card');
        setTimeout(() => {
            window.print();
        }, 100);
    };

    const handleDownloadPDF = async () => {
        setActiveTab('job_card');
        
        setTimeout(async () => {
            if (!pdfRef.current || isDownloading) return;
    
            setIsDownloading(true);
            try {
                await waitForImagesToLoad(pdfRef.current!);
                const canvas = await html2canvas(pdfRef.current, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff'
                });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`JobCard_${workOrder.id}.pdf`);
            } catch (error) {
                console.error("Failed to generate PDF:", error);
                alert("Sorry, there was an error generating the PDF. The logo might be causing an issue.");
            } finally {
                setIsDownloading(false);
            }
        }, 100);
    };

    const getPaymentStatusBadge = () => {
        if (isFullyPaid) {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full text-green-800 bg-green-100 dark:bg-green-900/50 dark:text-green-300">Fully Paid</span>;
        }
        if (workOrder.amountPaid > 0) {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full text-yellow-800 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300">Partially Paid</span>;
        }
        return <span className="px-2 py-1 text-xs font-semibold rounded-full text-red-800 bg-red-100 dark:bg-red-900/50 dark:text-red-300">Unpaid</span>;
    };


    return (
        <div className="p-4 md:p-6 bg-muted dark:bg-dark-muted min-h-full">
            <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center no-print">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Work Order Details</h1>
                        <p className="font-mono text-sm text-foreground-muted dark:text-dark-foreground-muted">{workOrder.id}</p>
                    </div>
                    <button onClick={onBack} className="text-sm font-bold text-primary dark:text-dark-primary hover:underline self-end md:self-center">&larr; Back to List</button>
                </div>
                
                <div className="flex justify-between items-center no-print">
                    <div className="flex space-x-1 border-b border-border dark:border-dark-border">
                        <TabButton label="Details & Status" isActive={activeTab === 'details'} onClick={() => setActiveTab('details')} />
                        <TabButton label="Job Card" isActive={activeTab === 'job_card'} onClick={() => setActiveTab('job_card')} />
                    </div>
                     <div className="flex items-center gap-2">
                        <motion.button onClick={handlePrint} whileTap={{scale: 0.95}} className="bg-card dark:bg-dark-card text-foreground dark:text-dark-foreground font-semibold px-4 py-2 rounded-lg border border-border dark:border-dark-border">
                            Print
                        </motion.button>
                        <motion.button onClick={handleDownloadPDF} disabled={isDownloading} whileTap={{scale: 0.95}} className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg disabled:bg-slate-400">
                            {isDownloading ? 'Downloading...' : 'Download PDF'}
                        </motion.button>
                        {!isFullyPaid && (
                            <motion.button 
                                onClick={() => onPushToPOS(workOrder)} 
                                whileTap={{scale: 0.95}} 
                                className="bg-primary text-primary-content font-bold py-2 px-4 rounded-lg"
                            >
                                Pay Balance (Ksh {workOrder.balanceDue.toFixed(2)})
                            </motion.button>
                        )}
                    </div>
                </div>

                 <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    {activeTab === 'details' ? (
                        <div className="space-y-6">
                            <div className="bg-card dark:bg-dark-card p-6 rounded-xl shadow-md space-y-4">
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div><p className="text-xs font-semibold text-foreground-muted">Customer</p><p className="font-bold">{workOrder.customerName}</p></div>
                                    <div><p className="text-xs font-semibold text-foreground-muted">Job Title</p><p className="font-bold">{workOrder.jobTitle}</p></div>
                                    <div><p className="text-xs font-semibold text-foreground-muted">Promised By</p><p className="font-bold">{workOrder.promisedDate ? new Date(workOrder.promisedDate).toLocaleDateString() : 'N/A'}</p></div>
                               </div>
                               <div>
                                    <p className="text-xs font-semibold text-foreground-muted">Description</p>
                                    <p className="p-2 bg-muted dark:bg-dark-muted rounded mt-1 whitespace-pre-wrap text-sm">{workOrder.description}</p>
                               </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t dark:border-dark-border">
                                    <div>
                                        <label className="block text-sm font-medium">Status</label>
                                        <select value={status} onChange={e => handleStatusChange(e.target.value as any)} className="w-full mt-1 p-2 border border-border dark:border-dark-border rounded-md bg-card dark:bg-dark-card">
                                            {(['Pending', 'InProgress', 'Completed', 'Closed', 'Cancelled', 'Warranty'] as const).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Assign to Technician</label>
                                        <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="w-full mt-1 p-2 border border-border dark:border-dark-border rounded-md bg-card dark:bg-dark-card">
                                            <option value="">Unassigned</option>
                                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {hasChanges && <div className="flex justify-end"><button onClick={handleUpdate} className="bg-primary text-primary-content font-bold py-2 px-6 rounded-lg">Save Changes</button></div>}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-card dark:bg-dark-card p-6 rounded-xl shadow-md">
                                    <h3 className="text-lg font-bold mb-2">Financial Breakdown</h3>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between items-center"><span className="text-foreground-muted">Payment Status:</span> {getPaymentStatusBadge()}</div>
                                        <div className="flex justify-between"><span className="text-foreground-muted">Labor Cost:</span> <span className="font-mono">{workOrder.labourAmount.toFixed(2)}</span></div>
                                        <div className="flex justify-between"><span className="text-foreground-muted">Materials Cost:</span> <span className="font-mono">{workOrder.materialsSubtotal.toFixed(2)}</span></div>
                                        <div className="flex justify-between"><span className="text-foreground-muted">VAT ({settings.tax.vatRate}%):</span> <span className="font-mono">{workOrder.vatAmount.toFixed(2)}</span></div>
                                        <div className="flex justify-between font-bold border-t pt-1 mt-1"><span>Total Cost:</span> <span className="font-mono">{workOrder.totalCost.toFixed(2)}</span></div>
                                        <div className="flex justify-between"><span className="text-foreground-muted">Total Paid:</span> <span className="font-mono text-green-600">{workOrder.amountPaid.toFixed(2)}</span></div>
                                        {workOrder.balanceDue > 0 ? (
                                            <div className="flex justify-between font-bold text-lg text-danger pt-1 mt-1"><span>Balance Due:</span> <span className="font-mono">{workOrder.balanceDue.toFixed(2)}</span></div>
                                        ) : workOrder.balanceDue < 0 ? (
                                            <div className="flex justify-between font-bold text-lg text-green-600 pt-1 mt-1"><span>Credit:</span> <span className="font-mono">{Math.abs(workOrder.balanceDue).toFixed(2)}</span></div>
                                        ) : (
                                            <div className="flex justify-between font-bold text-lg text-green-600 pt-1 mt-1"><span>Balance:</span> <span className="font-mono">0.00</span></div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-card dark:bg-dark-card p-6 rounded-xl shadow-md">
                                    <h3 className="text-lg font-bold mb-2">Payment History</h3>
                                    {linkedSales.length > 0 ? (
                                        <ul className="divide-y dark:divide-dark-border text-sm">
                                            {linkedSales.map(sale => (
                                                <li key={sale.id} className="py-2">
                                                    <div className="flex justify-between"><span>{new Date(sale.date).toLocaleDateString()}</span><span className="font-mono font-semibold">{sale.total.toFixed(2)}</span></div>
                                                    <p className="text-xs text-foreground-muted">{sale.items[0].name}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-foreground-muted">No payments recorded for this work order yet.</p>
                                    )}
                                </div>
                            </div>
                            {/* Variance alert */}
                            {workOrder.hasVariance && !workOrder.varianceResolved && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-400 rounded-xl p-4">
                                    <p className="font-bold text-yellow-800 dark:text-yellow-300">⚠ Variance Detected</p>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">One or more materials used exceed the quoted quantity. A manager must resolve all variances before this work order can be closed and invoiced.</p>
                                </div>
                            )}
                            {/* Materials used */}
                            {materials.length > 0 && (
                                <div className="bg-card dark:bg-dark-card p-6 rounded-xl shadow-md">
                                    <h3 className="text-lg font-bold mb-3">Materials Used</h3>
                                    <table className="w-full text-sm">
                                        <thead className="text-xs text-foreground-muted uppercase">
                                            <tr>
                                                <th className="py-2 text-left">Item</th>
                                                <th className="py-2 text-right">Quoted</th>
                                                <th className="py-2 text-right">Actual</th>
                                                <th className="py-2 text-right">Unit Price</th>
                                                <th className="py-2 text-right">Total</th>
                                                <th className="py-2 text-center">Variance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {materials.map(m => (
                                                <tr key={m.id} className={`border-t border-border dark:border-dark-border ${m.varianceFlag ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}>
                                                    <td className="py-2">{m.name}</td>
                                                    <td className="py-2 text-right font-mono">{m.qty}</td>
                                                    <td className="py-2 text-right font-mono">{m.qtyActual ?? m.qty}</td>
                                                    <td className="py-2 text-right font-mono">{m.unitPrice.toFixed(2)}</td>
                                                    <td className="py-2 text-right font-mono">{m.lineTotal.toFixed(2)}</td>
                                                    <td className="py-2 text-center">
                                                        {m.varianceFlag ? (
                                                            m.varianceResolution ? (
                                                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{m.varianceResolution}</span>
                                                            ) : (
                                                                <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Pending</span>
                                                            )
                                                        ) : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="print-area">
                             <JobCardDocument ref={pdfRef} workOrder={workOrder} materials={materials} users={users} settings={settings} />
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};