import React from 'react';
import { WorkOrder, WorkOrderMaterial, Settings, Sale } from '../../types';

interface WOInvoiceDocumentProps {
    workOrder: WorkOrder;
    materials: WorkOrderMaterial[];
    settings: Settings;
    linkedSales: Sale[];
    quotationNumber?: string;
}

const WOInvoiceDocument = React.forwardRef<HTMLDivElement, WOInvoiceDocumentProps>(
    ({ workOrder, materials, settings, linkedSales, quotationNumber }, ref) => {
        const invoiceNumber = `INV-${workOrder.id.slice(-8).toUpperCase()}`;
        const totalPaid = workOrder.amountPaid;
        const balanceDue = workOrder.balanceDue;

        return (
            <div ref={ref} className="bg-white p-8 font-sans text-sm text-black w-full max-w-4xl mx-auto">
                {/* Header */}
                <header className="flex justify-between items-start pb-6 border-b-2 border-black">
                    <div>
                        {settings.businessInfo.logoUrl && (
                            <img src={settings.businessInfo.logoUrl} alt="Logo" className="h-16 max-w-xs object-contain mb-3" />
                        )}
                        <h2 className="text-lg font-bold">{settings.businessInfo.name}</h2>
                        <p className="text-slate-600 text-xs">{settings.businessInfo.location}</p>
                        <p className="text-slate-600 text-xs">Tel: {settings.businessInfo.phone}</p>
                        {settings.businessInfo.kraPin && <p className="text-slate-600 text-xs">PIN: {settings.businessInfo.kraPin}</p>}
                    </div>
                    <div className="text-right">
                        <h1 className="text-4xl font-bold uppercase text-slate-800 tracking-widest">INVOICE</h1>
                        <div className="mt-3 text-xs space-y-1">
                            <p className="flex justify-end gap-3"><span className="text-slate-500">Invoice #:</span><span className="font-bold">{invoiceNumber}</span></p>
                            <p className="flex justify-end gap-3"><span className="text-slate-500">WO #:</span><span className="font-semibold">{workOrder.id}</span></p>
                            {quotationNumber && <p className="flex justify-end gap-3"><span className="text-slate-500">Quote Ref:</span><span className="font-semibold">{quotationNumber}</span></p>}
                            <p className="flex justify-end gap-3"><span className="text-slate-500">Date:</span><span className="font-semibold">{new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi' })}</span></p>
                        </div>
                    </div>
                </header>

                {/* Bill To */}
                <section className="mt-6 grid grid-cols-2 gap-8">
                    <div>
                        <p className="text-xs font-bold uppercase text-slate-500 mb-1">Bill To</p>
                        <p className="font-bold text-slate-800">{workOrder.customerName}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold uppercase text-slate-500 mb-1">Service Description</p>
                        <p className="font-semibold text-slate-800">{workOrder.jobTitle}</p>
                        {workOrder.promisedDate && (
                            <p className="text-xs text-slate-500 mt-1">Promised: {new Date(workOrder.promisedDate).toLocaleDateString('en-GB')}</p>
                        )}
                    </div>
                </section>

                {/* Line Items */}
                <section className="mt-8">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800 text-white text-xs uppercase">
                                <th className="p-3 font-semibold">Description</th>
                                <th className="p-3 font-semibold text-center">Qty</th>
                                <th className="p-3 font-semibold text-right">Unit Price</th>
                                <th className="p-3 font-semibold text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materials.map((item, i) => (
                                <tr key={item.id} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                                    <td className="p-3">{item.name}</td>
                                    <td className="p-3 text-center font-mono">{item.qtyActual ?? item.qty}</td>
                                    <td className="p-3 text-right font-mono">{item.unitPrice.toFixed(2)}</td>
                                    <td className="p-3 text-right font-mono font-semibold">{((item.qtyActual ?? item.qty) * item.unitPrice).toFixed(2)}</td>
                                </tr>
                            ))}
                            {workOrder.labourAmount > 0 && (
                                <tr className={materials.length % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                                    <td className="p-3">Labour Charges</td>
                                    <td className="p-3 text-center font-mono">1</td>
                                    <td className="p-3 text-right font-mono">{workOrder.labourAmount.toFixed(2)}</td>
                                    <td className="p-3 text-right font-mono font-semibold">{workOrder.labourAmount.toFixed(2)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </section>

                {/* Totals */}
                <section className="flex justify-end mt-4">
                    <div className="w-72 space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-slate-600">Subtotal:</span><span className="font-mono">{(workOrder.materialsSubtotal + workOrder.labourAmount).toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-600">VAT ({settings.tax.vatRate}%):</span><span className="font-mono">{workOrder.vatAmount.toFixed(2)}</span></div>
                        <div className="flex justify-between text-base font-bold border-t-2 border-black pt-2 mt-2">
                            <span>Total:</span><span className="font-mono">KES {workOrder.totalCost.toFixed(2)}</span>
                        </div>
                        {totalPaid > 0 && (
                            <div className="flex justify-between text-green-700"><span>Amount Paid:</span><span className="font-mono">({totalPaid.toFixed(2)})</span></div>
                        )}
                        <div className={`flex justify-between text-lg font-bold border-t pt-1 ${balanceDue > 0 ? 'text-red-700' : 'text-green-700'}`}>
                            <span>{balanceDue > 0 ? 'Balance Due:' : 'PAID IN FULL'}</span>
                            <span className="font-mono">KES {Math.abs(balanceDue).toFixed(2)}</span>
                        </div>
                    </div>
                </section>

                {/* Payment history */}
                {linkedSales.length > 0 && (
                    <section className="mt-8 border-t pt-4">
                        <p className="text-xs font-bold uppercase text-slate-500 mb-2">Payment History</p>
                        <table className="w-full text-xs">
                            <thead><tr className="text-slate-500 uppercase"><th className="text-left py-1">Date</th><th className="text-left py-1">Description</th><th className="text-right py-1">Amount</th></tr></thead>
                            <tbody>
                                {linkedSales.map(s => (
                                    <tr key={s.id} className="border-t border-slate-100">
                                        <td className="py-1">{new Date(s.date).toLocaleDateString('en-GB')}</td>
                                        <td className="py-1">{s.items[0]?.name}</td>
                                        <td className="py-1 text-right font-mono">{s.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                )}

                {/* Footer */}
                <footer className="mt-12 pt-4 border-t text-center text-xs text-slate-500">
                    <p>Thank you for your business — {settings.businessInfo.name}</p>
                    {settings.businessInfo.phone && <p>Tel: {settings.businessInfo.phone}</p>}
                </footer>
            </div>
        );
    }
);

export default WOInvoiceDocument;
