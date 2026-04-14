

import React, { useRef, useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Quotation, Settings, Permission, Sale } from '../../types';
import QuoteDocument from './QuoteDocument';
import { ModernButton, ModernPanel, ModernShell, ModernStatCard } from '../common/ModernUI';

interface QuotationDetailViewProps {
    quotation: Quotation;
    settings: Settings;
    sales: Sale[];
    onBack: () => void;
    onConvertQuoteToSale: (quotation: Quotation) => void;
    permissions: Permission[];
}

type DocumentType = 'Quotation' | 'Proforma-Invoice';

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


const QuotationDetailView: React.FC<QuotationDetailViewProps> = ({ quotation, settings, sales, onBack, onConvertQuoteToSale, permissions }) => {
    const pdfRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadType, setDownloadType] = useState<DocumentType | null>(null);

    const canManage = permissions.includes('manage_quotations');
    
    const linkedSale = useMemo(() => sales.find(s => s.quotationId === quotation.id), [sales, quotation.id]);
    const formatCurrency = (amount: number) => `Ksh ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const handleDownload = async (type: DocumentType) => {
        if (!pdfRef.current || isDownloading) return;

        setIsDownloading(true);
        setDownloadType(type);

        // Allow component to re-render with the correct title before capturing
        requestAnimationFrame(async () => {
            try {
                if (!pdfRef.current) throw new Error("PDF reference is not available.");
                await waitForImagesToLoad(pdfRef.current);
                const canvas = await html2canvas(pdfRef.current!, {
                    scale: 2,
                    useCORS: true,
                });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`${type}_${quotation.quoteNumber}.pdf`);
            } catch (error) {
                console.error("Failed to generate PDF:", error);
                alert("Sorry, there was an error generating the PDF. The logo might be causing an issue.");
            } finally {
                setIsDownloading(false);
                setDownloadType(null);
            }
        });
    };
    
    const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;

    return (
        <ModernShell
            eyebrow="Customer Document"
            title={`Quotation ${quotation.quoteNumber}`}
            description="Review the quotation document, export a branded PDF, or convert the approved quote into an invoice."
            actions={
                <div className="flex flex-wrap items-center gap-2">
                    <ModernButton variant="secondary" onClick={onBack}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Back
                    </ModernButton>
                    {canManage ? (
                        <>
                            <ModernButton onClick={() => handleDownload('Quotation')} disabled={isDownloading}>
                                <DownloadIcon />{isDownloading && downloadType === 'Quotation' ? 'Downloading...' : 'Quote PDF'}
                            </ModernButton>
                            <ModernButton variant="secondary" onClick={() => handleDownload('Proforma-Invoice')} disabled={isDownloading}>
                                <DownloadIcon />{isDownloading && downloadType === 'Proforma-Invoice' ? 'Downloading...' : 'Pro-forma PDF'}
                            </ModernButton>
                            {!linkedSale && quotation.status === 'Approved' ? (
                                <ModernButton variant="secondary" onClick={() => onConvertQuoteToSale(quotation)}>
                                    Create Invoice
                                </ModernButton>
                            ) : null}
                        </>
                    ) : null}
                </div>
            }
        >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <ModernStatCard title="Status" value={linkedSale ? 'Invoiced' : quotation.status} subtitle={quotation.customerName} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 3h8l4 4v14H4V3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 3v4h4" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M8 16h5" /></svg>} accent="violet" />
                <ModernStatCard title="Quotation Total" value={formatCurrency(quotation.total)} subtitle={`VAT ${settings.tax.vatRate}% included`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.2 0-4 1.12-4 2.5S9.8 13 12 13s4 1.12 4 2.5S14.2 18 12 18s-4-1.12-4-2.5M12 6v12" /></svg>} accent="emerald" />
                <ModernStatCard title="Valid Until" value={new Date(quotation.expiryDate).toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi' })} subtitle={`Created ${new Date(quotation.createdDate).toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi' })}`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 3v4M8 3v4M3 11h18" /></svg>} accent="amber" />
                <ModernStatCard title="Linked Invoice" value={linkedSale ? linkedSale.id : 'Not yet'} subtitle={linkedSale ? 'Quotation already converted' : 'Ready once approved'} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8M8 11h8M8 15h5" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 3h9l3 3v15H6V3Z" /></svg>} accent="blue" />
            </div>

            <ModernPanel className="overflow-hidden p-4 md:p-6">
                <div id="pdf-content-wrapper">
                    <QuoteDocument
                        ref={pdfRef}
                        quotation={quotation}
                        settings={settings}
                        documentType={downloadType || 'Quotation'}
                        isPaid={!!linkedSale}
                        linkedSaleId={linkedSale?.id}
                    />
                </div>
            </ModernPanel>
        </ModernShell>
    );
};

export default QuotationDetailView;
