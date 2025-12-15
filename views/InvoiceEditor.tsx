import React, { useState, useEffect, useCallback } from 'react';
import { InvoiceData, InvoiceItem, AppSettings, User } from '../types';
import { PrinterIcon, PlusIcon, TrashIcon, PalmTreeIcon, ChevronLeftIcon, EyeIcon, EditIcon, DownloadIcon, MailIcon } from '../components/Icons';

interface InvoiceEditorProps {
  initialData?: InvoiceData | null;
  settings: AppSettings;
  onSave: (data: InvoiceData) => void;
  onBack: () => void;
  isSaving?: boolean;
  initialMode?: 'edit' | 'preview';
  autoPrint?: boolean;
  currentUser: User;
}

export default function InvoiceEditor({ initialData, settings, onSave, onBack, isSaving = false, initialMode = 'edit', autoPrint = false, currentUser }: InvoiceEditorProps) {
  const isViewer = currentUser.role === 'viewer';
  
  const defaultInvoice: InvoiceData = {
    id: crypto.randomUUID(),
    invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
    status: 'draft',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    clientName: '',
    clientAddress: '',
    clientEmail: '',
    currency: settings.currencySymbol,
    taxRate: settings.defaultTaxRate,
    notes: 'Thank you for your business. We appreciate the opportunity to work with you.',
    terms: 'Payment is due within 14 days.',
    items: [
      { id: crypto.randomUUID(), description: 'Service Description', quantity: 1, rate: 0 },
    ],
  };

  const [data, setData] = useState<InvoiceData>(initialData || defaultInvoice);
  // Viewers are always in preview mode
  const [isPreview, setIsPreview] = useState(isViewer ? true : initialMode === 'preview');

  useEffect(() => {
    if (isViewer) {
      setIsPreview(true);
    } else {
      setIsPreview(initialMode === 'preview');
    }
  }, [initialMode, isViewer]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadPDF = useCallback(() => {
    const element = document.getElementById('invoice-pdf-content');
    
    // Ensure we are in preview mode to capture clean UI
    if (!isPreview) setIsPreview(true);

    // Give DOM a moment to update if we just switched to preview
    setTimeout(() => {
        if (typeof (window as any).html2pdf !== 'undefined' && element) {
            const opt = {
                margin: 0.2,
                filename: `${data.invoiceNumber || 'invoice'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };
            (window as any).html2pdf().set(opt).from(element).save();
        } else {
            // Fallback if library fails
            console.warn("html2pdf library not found, falling back to print dialog");
            window.print();
        }
    }, 500);
  }, [data.invoiceNumber, isPreview]);

  // Handle auto-trigger for download from list view
  useEffect(() => {
    if (autoPrint) {
      handleDownloadPDF();
    }
  }, [autoPrint, handleDownloadPDF]);

  const handleChange = (field: keyof InvoiceData, value: string | number) => {
    if (isViewer) return;
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
    if (isViewer) return;
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addItem = () => {
    if (isViewer) return;
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      rate: 0,
    };
    setData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeItem = (id: string) => {
    if (isViewer) return;
    setData((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }));
  };

  const calculateSubtotal = () => {
    return data.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
  };

  const subtotal = calculateSubtotal();
  const taxAmount = subtotal * (data.taxRate / 100);
  const grandTotal = subtotal + taxAmount;

  // CSS for preview mode to match print output
  const previewStyles = `
    .preview-mode input, .preview-mode textarea {
      background: transparent !important;
      border: none !important;
      resize: none !important;
      padding: 0 !important;
      box-shadow: none !important;
    }
    .preview-mode input::placeholder, .preview-mode textarea::placeholder {
      color: transparent !important;
    }
    .preview-mode select {
      appearance: none;
      border: none;
      background: transparent;
      padding: 0;
      pointer-events: none;
    }
    /* Hide items that should not be visible in preview */
    .preview-mode .edit-only {
      display: none !important;
    }
  `;

  // Utility to hide elements in preview or print
  const editOnlyClass = isPreview ? 'hidden' : 'no-print';

  // Mailto Generator
  const sendEmail = () => {
    const subject = `Invoice ${data.invoiceNumber} from ${settings.companyName}`;
    const body = `Dear ${data.clientName || 'Client'},%0D%0A%0D%0APlease find attached the invoice ${data.invoiceNumber} dated ${data.date}.%0D%0A%0D%0AAmount Due: ${data.currency} ${grandTotal.toFixed(2)}%0D%0A%0D%0AThank you for your business.%0D%0A%0D%0ABest regards,%0D%0A${settings.companyName}`;
    window.location.href = `mailto:${data.clientEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div className={`${isPreview ? 'fixed inset-0 z-50 bg-gray-100 overflow-y-auto' : 'flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 w-full'}`}>
      <style>{previewStyles}</style>

      {/* Toolbar */}
      <div className={`${isPreview ? 'fixed top-0 left-0 right-0 bg-white shadow-md p-4 z-50 flex justify-center no-print' : 'w-full max-w-4xl mb-6 flex justify-between items-center no-print'}`}>
        <div className={`flex justify-between items-center ${isPreview ? 'w-full max-w-4xl' : 'w-full'}`}>
          {/* Back Button */}
          <button
            onClick={onBack}
            disabled={isSaving}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            <ChevronLeftIcon />
            Back to List
          </button>

          {/* Spacer for preview mode alignment if needed */}
          {isPreview && <div></div>}

          <div className="flex gap-2 ml-auto">
             {/* Toggle Preview Button - Hidden for viewers */}
            {!isViewer && (
              <button
                 onClick={() => setIsPreview(!isPreview)}
                 disabled={isSaving}
                 className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
              >
                 {isPreview ? (
                   <>
                     <EditIcon className="w-4 h-4" />
                     Edit
                   </>
                 ) : (
                   <>
                     <EyeIcon className="w-4 h-4" />
                     Preview
                   </>
                 )}
              </button>
            )}

             {/* Send Email Button */}
            <button
              onClick={sendEmail}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              title="Send via Email"
            >
              <MailIcon className="w-4 h-4" />
              Send
            </button>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-900 focus:outline-none shadow-sm transition-colors disabled:opacity-50"
              title="Download PDF"
            >
              <DownloadIcon className="w-4 h-4" />
              Download PDF
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-sandpix-600 rounded-lg hover:bg-sandpix-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sandpix-500 shadow-sm transition-colors disabled:opacity-50"
            >
              <PrinterIcon className="w-4 h-4" />
              Print
            </button>
            
            {/* Save Button (Edit Mode Only and NOT viewer) */}
            {!isPreview && !isViewer && (
              <button
                onClick={() => onSave(data)}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-wait flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Spacer for fixed toolbar in preview */}
      {isPreview && <div className="h-24 w-full no-print"></div>}

      {/* Invoice Paper */}
      <div id="invoice-pdf-content" className={`w-full max-w-4xl bg-white shadow-xl rounded-xl overflow-hidden print-shadow-none print-full-width transition-all duration-300 ${isPreview ? 'preview-mode' : ''}`}>
        
        {/* Header Color Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-sandpix-500 to-teal-400"></div>

        <div className="p-8 md:p-12">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div className="flex flex-col">
               <div className="flex items-center gap-3 mb-2">
                 {settings.logoUrl ? (
                   <img src={settings.logoUrl} alt="Company Logo" className="h-16 w-auto object-contain" />
                 ) : (
                   <PalmTreeIcon className="w-10 h-10 text-sandpix-600" />
                 )}
                 <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{settings.companyName}</h2>
               </div>
               <p className="text-gray-500 text-sm font-medium">Capture the beauty of the islands.</p>
               {settings.gstNumber && (
                 <p className="text-gray-400 text-xs mt-1 font-medium">GST No: {settings.gstNumber}</p>
               )}
            </div>
            <div className="w-full md:w-auto text-right">
              <h1 className="text-4xl font-light text-gray-200 uppercase tracking-widest mb-2">Invoice</h1>
              <div className="flex flex-col gap-1 items-end">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-500 uppercase">No.</span>
                  <input
                    type="text"
                    value={data.invoiceNumber}
                    onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                    disabled={isViewer}
                    className="text-right font-mono font-bold text-gray-800 bg-gray-50 hover:bg-white focus:bg-white border-b border-transparent hover:border-gray-300 focus:border-sandpix-500 focus:outline-none px-2 py-1 w-32 transition-colors disabled:bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-sm font-semibold text-gray-500 uppercase">Date</span>
                   <input
                    type="date"
                    value={data.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    disabled={isViewer}
                    className="text-right font-mono text-gray-600 bg-gray-50 hover:bg-white focus:bg-white border-b border-transparent hover:border-gray-300 focus:border-sandpix-500 focus:outline-none px-2 py-1 w-32 transition-colors disabled:bg-transparent"
                  />
                </div>
                <div className={`flex items-center gap-2 ${editOnlyClass}`}>
                   <span className="text-sm font-semibold text-gray-500 uppercase">Status</span>
                   <select
                    value={data.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    disabled={isViewer}
                    className="text-right font-mono text-xs font-bold uppercase bg-gray-50 border-none rounded p-1 text-gray-600 focus:ring-0"
                   >
                     <option value="draft">Draft</option>
                     <option value="pending">Pending</option>
                     <option value="paid">Paid</option>
                   </select>
                </div>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="flex flex-col md:flex-row gap-12 mb-12">
            <div className="w-full md:w-1/2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">From</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-bold text-gray-900">{settings.companyName}</p>
                <div className="whitespace-pre-line">{settings.companyAddress}</div>
                <p>{settings.companyEmail}</p>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bill To</h3>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Client Name"
                  value={data.clientName}
                  onChange={(e) => handleChange('clientName', e.target.value)}
                  disabled={isViewer}
                  className="w-full font-bold text-gray-900 placeholder-gray-300 focus:outline-none border-b border-gray-200 focus:border-sandpix-500 py-1 transition-colors bg-transparent"
                />
                <textarea
                  placeholder="Client Address"
                  value={data.clientAddress}
                  onChange={(e) => handleChange('clientAddress', e.target.value)}
                  disabled={isViewer}
                  rows={3}
                  className="w-full text-sm text-gray-600 placeholder-gray-300 focus:outline-none border-b border-gray-200 focus:border-sandpix-500 py-1 transition-colors resize-none bg-transparent"
                />
                <input
                  type="email"
                  placeholder="client@email.com"
                  value={data.clientEmail}
                  onChange={(e) => handleChange('clientEmail', e.target.value)}
                  disabled={isViewer}
                  className="w-full text-sm text-gray-600 placeholder-gray-300 focus:outline-none border-b border-gray-200 focus:border-sandpix-500 py-1 transition-colors bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-10">
            <div className="grid grid-cols-12 gap-4 border-b-2 border-gray-100 pb-3 mb-4">
              <div className="col-span-6 md:col-span-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Description</div>
              <div className="col-span-2 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Qty</div>
              <div className="col-span-2 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Rate</div>
              <div className="col-span-2 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</div>
            </div>

            <div className="space-y-3">
              {data.items.map((item) => (
                <div key={item.id} className="group grid grid-cols-12 gap-4 items-start relative">
                  
                  {/* Description */}
                  <div className="col-span-6 md:col-span-6">
                    <textarea
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      disabled={isViewer}
                      placeholder="Item description"
                      rows={1}
                      className="w-full text-sm text-gray-800 placeholder-gray-300 focus:outline-none border-b border-transparent hover:border-gray-200 focus:border-sandpix-500 py-1 bg-transparent resize-none overflow-hidden"
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                    />
                  </div>

                  {/* Quantity */}
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      disabled={isViewer}
                      className="w-full text-right text-sm text-gray-600 focus:outline-none border-b border-transparent hover:border-gray-200 focus:border-sandpix-500 py-1 bg-transparent"
                    />
                  </div>

                  {/* Rate */}
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      disabled={isViewer}
                      className="w-full text-right text-sm text-gray-600 focus:outline-none border-b border-transparent hover:border-gray-200 focus:border-sandpix-500 py-1 bg-transparent"
                    />
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 text-right py-1">
                    <span className="text-sm font-medium text-gray-800">
                      {data.currency} { (item.quantity * item.rate).toFixed(2) }
                    </span>
                  </div>

                  {/* Delete Button (Hidden on Print & Preview & Viewer) */}
                  {!isViewer && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className={`absolute -right-6 top-1.5 p-1 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ${editOnlyClass}`}
                      title="Remove item"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className={`mt-6 ${editOnlyClass}`}>
              {!isViewer && (
                <button
                  onClick={addItem}
                  className="flex items-center gap-2 text-sm font-semibold text-sandpix-600 hover:text-sandpix-700 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Line Item
                </button>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="flex flex-col md:flex-row justify-end mb-12 border-t border-gray-100 pt-6">
            <div className="w-full md:w-1/3 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-500">Subtotal</span>
                <span className="font-bold text-gray-800">{data.currency} {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-500">Tax</span>
                  <div className={`flex items-center gap-1 bg-gray-50 rounded px-1 ${editOnlyClass}`}>
                    <input
                      type="number"
                      value={data.taxRate}
                      onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                      disabled={isViewer}
                      className="w-8 text-right bg-transparent text-xs font-medium text-gray-500 focus:outline-none"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  {/* Show tax rate text when in preview or print */}
                  <span className={`text-xs text-gray-400 ${!isPreview ? 'hidden print:inline' : ''}`}>({data.taxRate}%)</span>
                </div>
                <span className="font-bold text-gray-800">{data.currency} {taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-extrabold text-sandpix-600">{data.currency} {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-8">
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notes</h4>
              <textarea
                value={data.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                disabled={isViewer}
                rows={3}
                className="w-full text-sm text-gray-600 bg-transparent resize-none focus:outline-none border border-transparent hover:border-gray-200 rounded p-1"
              />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Terms & Conditions</h4>
              <textarea
                value={data.terms}
                onChange={(e) => handleChange('terms', e.target.value)}
                disabled={isViewer}
                rows={3}
                className="w-full text-sm text-gray-600 bg-transparent resize-none focus:outline-none border border-transparent hover:border-gray-200 rounded p-1"
              />
            </div>
          </div>
          
          <div className="mt-12 text-center">
             <p className="text-xs text-gray-300">Generated by Sandpix Maldives Invoicer</p>
          </div>

        </div>
      </div>
    </div>
  );
}