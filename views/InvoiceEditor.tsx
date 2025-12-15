import React, { useState, useEffect } from 'react';
import { InvoiceData, InvoiceItem, AppSettings, User } from '../types';
import { PrinterIcon, PlusIcon, TrashIcon, PalmTreeIcon, ChevronLeftIcon, EyeIcon, EditIcon } from '../components/Icons';

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
  const [isPreview, setIsPreview] = useState(isViewer ? true : initialMode === 'preview');

  // Handle auto-print
  useEffect(() => {
    if (autoPrint) {
        setIsPreview(true);
        setTimeout(() => {
            window.print();
        }, 500);
    }
  }, [autoPrint]);

  // Viewers locked to preview
  useEffect(() => {
      if (isViewer) setIsPreview(true);
  }, [isViewer]);

  const handleAddItem = () => {
    setData({
      ...data,
      items: [...data.items, { id: crypto.randomUUID(), description: '', quantity: 1, rate: 0 }]
    });
  };

  const handleRemoveItem = (id: string) => {
    if (data.items.length === 1) return;
    setData({
      ...data,
      items: data.items.filter(item => item.id !== id)
    });
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setData({
      ...data,
      items: data.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    });
  };

  const calculateTotals = () => {
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const taxAmount = subtotal * (data.taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  const handleSaveClick = () => {
      if (!data.clientName) {
          alert('Please enter a client name');
          return;
      }
      onSave(data);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto print:p-0 print:max-w-none">
      
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 no-print">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white rounded-full transition-colors text-gray-500"
            title="Back to List"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">
            {data.id.length > 20 ? (isPreview ? 'View Invoice' : 'Edit Invoice') : 'New Invoice'}
          </h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
           {!isViewer && (
             <button
                onClick={() => setIsPreview(!isPreview)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
             >
                {isPreview ? <><EditIcon className="w-4 h-4"/> Edit Mode</> : <><EyeIcon className="w-4 h-4"/> Preview</>}
             </button>
           )}
           
           <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
           >
              <PrinterIcon className="w-4 h-4"/> Print
           </button>

           {!isViewer && !isPreview && (
             <button
                onClick={handleSaveClick}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-sandpix-600 text-white rounded-lg hover:bg-sandpix-700 transition-colors text-sm font-medium shadow-sm disabled:opacity-70"
             >
                {isSaving ? 'Saving...' : 'Save Invoice'}
             </button>
           )}
        </div>
      </div>

      {/* Invoice Paper */}
      <div className={`bg-white rounded-xl shadow-lg print:shadow-none print:rounded-none min-h-[1000px] p-8 md:p-12 print:p-8 relative overflow-hidden transition-all duration-300 ${isPreview ? 'max-w-[210mm] mx-auto' : ''}`}>
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
           <div className="flex flex-col items-start gap-2"> {/* Stacked logo and name */}
              {settings.logoUrl ? (
                 <img src={settings.logoUrl} alt="Logo" className="h-20 w-auto object-contain" />
              ) : (
                 <div className="w-16 h-16 bg-sandpix-50 rounded-lg flex items-center justify-center">
                    <PalmTreeIcon className="w-8 h-8 text-sandpix-600" />
                 </div>
              )}
              <div className="mt-2">
                 <h2 className="font-bold text-gray-900 leading-tight" style={{ fontSize: '14pt' }}>
                    {settings.companyName}
                 </h2>
                 <p className="text-sm text-gray-500 whitespace-pre-line mt-1">{settings.companyAddress}</p>
                 <p className="text-sm text-gray-500 mt-1">{settings.companyEmail}</p>
                 {settings.gstNumber && <p className="text-sm text-gray-500">GST: {settings.gstNumber}</p>}
              </div>
           </div>

           <div className="text-right w-full md:w-auto">
              <h1 className="text-4xl font-light text-gray-300 uppercase tracking-widest mb-4">Invoice</h1>
              <div className="space-y-2">
                 <div className="flex justify-between md:justify-end gap-4 items-center">
                    <label className="text-sm font-semibold text-gray-600 uppercase">Invoice #</label>
                    {isPreview ? (
                        <span className="text-gray-900 font-medium">{data.invoiceNumber}</span>
                    ) : (
                        <input 
                           value={data.invoiceNumber}
                           onChange={e => setData({...data, invoiceNumber: e.target.value})}
                           className="text-right w-32 border-b border-gray-200 focus:border-sandpix-500 focus:outline-none py-1"
                        />
                    )}
                 </div>
                 <div className="flex justify-between md:justify-end gap-4 items-center">
                    <label className="text-sm font-semibold text-gray-600 uppercase">Date</label>
                    {isPreview ? (
                        <span className="text-gray-900">{data.date}</span>
                    ) : (
                        <input 
                           type="date"
                           value={data.date}
                           onChange={e => setData({...data, date: e.target.value})}
                           className="text-right w-32 border-b border-gray-200 focus:border-sandpix-500 focus:outline-none py-1"
                        />
                    )}
                 </div>
                 <div className="flex justify-between md:justify-end gap-4 items-center">
                    <label className="text-sm font-semibold text-gray-600 uppercase">Due Date</label>
                    {isPreview ? (
                        <span className="text-gray-900">{data.dueDate}</span>
                    ) : (
                        <input 
                           type="date"
                           value={data.dueDate}
                           onChange={e => setData({...data, dueDate: e.target.value})}
                           className="text-right w-32 border-b border-gray-200 focus:border-sandpix-500 focus:outline-none py-1"
                        />
                    )}
                 </div>
              </div>
           </div>
        </div>

        {/* Client Info */}
        <div className="mb-12">
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bill To</h3>
           {isPreview ? (
              <div className="text-gray-800">
                 <p className="font-bold text-lg">{data.clientName || 'N/A'}</p>
                 <p className="whitespace-pre-line">{data.clientAddress}</p>
                 <p>{data.clientEmail}</p>
              </div>
           ) : (
              <div className="grid gap-3 max-w-md bg-gray-50 p-4 rounded-lg border border-gray-100">
                 <input 
                    placeholder="Client Name" 
                    value={data.clientName} 
                    onChange={e => setData({...data, clientName: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-200 focus:border-sandpix-500 focus:outline-none py-1 font-medium"
                 />
                 <textarea 
                    placeholder="Client Address" 
                    value={data.clientAddress} 
                    onChange={e => setData({...data, clientAddress: e.target.value})}
                    rows={2}
                    className="w-full bg-transparent border-b border-gray-200 focus:border-sandpix-500 focus:outline-none py-1 text-sm"
                 />
                 <input 
                    placeholder="Client Email" 
                    value={data.clientEmail} 
                    onChange={e => setData({...data, clientEmail: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-200 focus:border-sandpix-500 focus:outline-none py-1 text-sm"
                 />
              </div>
           )}
        </div>

        {/* Items Table */}
        <div className="mb-8">
           <table className="w-full">
              <thead>
                 <tr className="border-b-2 border-gray-100">
                    <th className="text-left py-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-[50%]">Description</th>
                    <th className="text-right py-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-[15%]">Quantity</th>
                    <th className="text-right py-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-[15%]">Rate</th>
                    <th className="text-right py-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-[15%]">Amount</th>
                    {!isPreview && <th className="w-[5%]"></th>}
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {data.items.map((item) => (
                    <tr key={item.id} className="group">
                       <td className="py-4 align-top">
                          {isPreview ? (
                             <span className="text-gray-800 font-medium">{item.description}</span>
                          ) : (
                             <textarea
                                value={item.description}
                                onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                                placeholder="Item description"
                                rows={1}
                                className="w-full bg-transparent resize-none focus:outline-none font-medium text-gray-800"
                                onInput={(e) => {
                                   const target = e.target as HTMLTextAreaElement;
                                   target.style.height = "auto";
                                   target.style.height = target.scrollHeight + "px";
                                }}
                             />
                          )}
                       </td>
                       <td className="py-4 align-top text-right">
                          {isPreview ? (
                             <span className="text-gray-600">{item.quantity}</span>
                          ) : (
                             <input
                                type="number"
                                min="0"
                                value={item.quantity}
                                onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full text-right bg-transparent focus:outline-none text-gray-600"
                             />
                          )}
                       </td>
                       <td className="py-4 align-top text-right">
                          {isPreview ? (
                             <span className="text-gray-600">{item.rate.toLocaleString()}</span>
                          ) : (
                             <input
                                type="number"
                                min="0"
                                value={item.rate}
                                onChange={e => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                className="w-full text-right bg-transparent focus:outline-none text-gray-600"
                             />
                          )}
                       </td>
                       <td className="py-4 align-top text-right font-medium text-gray-900">
                          {(item.quantity * item.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                       </td>
                       {!isPreview && (
                          <td className="py-4 align-top text-right">
                             {data.items.length > 1 && (
                                <button 
                                   onClick={() => handleRemoveItem(item.id)}
                                   className="text-red-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                   <TrashIcon className="w-4 h-4" />
                                </button>
                             )}
                          </td>
                       )}
                    </tr>
                 ))}
              </tbody>
           </table>
           
           {!isPreview && (
              <button 
                 onClick={handleAddItem}
                 className="mt-4 flex items-center gap-2 text-sm font-medium text-sandpix-600 hover:text-sandpix-700 transition-colors"
              >
                 <PlusIcon className="w-4 h-4" /> Add Line Item
              </button>
           )}
        </div>

        {/* Totals & Notes */}
        <div className="flex flex-col md:flex-row gap-12 border-t border-gray-100 pt-8">
           <div className="flex-1 space-y-6">
              <div>
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notes</h3>
                 {isPreview ? (
                    <p className="text-sm text-gray-600 whitespace-pre-line">{data.notes}</p>
                 ) : (
                    <textarea
                       value={data.notes}
                       onChange={e => setData({...data, notes: e.target.value})}
                       rows={3}
                       className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded p-2 focus:outline-none focus:border-sandpix-500"
                       placeholder="Add notes..."
                    />
                 )}
              </div>
              <div>
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Terms & Conditions</h3>
                 {isPreview ? (
                    <p className="text-sm text-gray-600 whitespace-pre-line">{data.terms}</p>
                 ) : (
                    <textarea
                       value={data.terms}
                       onChange={e => setData({...data, terms: e.target.value})}
                       rows={2}
                       className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded p-2 focus:outline-none focus:border-sandpix-500"
                       placeholder="Add terms..."
                    />
                 )}
              </div>
           </div>

           <div className="w-full md:w-80">
              <div className="space-y-3">
                 <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{settings.currencySymbol}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                 </div>
                 <div className="flex justify-between items-center text-gray-600">
                    <div className="flex items-center gap-2">
                       <span>Tax</span>
                       {!isPreview && (
                          <div className="flex items-center bg-gray-100 rounded px-2">
                             <input
                                type="number"
                                value={data.taxRate}
                                onChange={e => setData({...data, taxRate: parseFloat(e.target.value) || 0})}
                                className="w-8 bg-transparent text-xs text-right focus:outline-none py-1"
                             />
                             <span className="text-xs">%</span>
                          </div>
                       )}
                       {isPreview && <span className="text-xs text-gray-400">({data.taxRate}%)</span>}
                    </div>
                    <span>{settings.currencySymbol}{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                 </div>
                 <div className="flex justify-between text-xl font-bold text-gray-900 border-t border-gray-200 pt-3">
                    <span>Total</span>
                    <span>{settings.currencySymbol}{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-xs text-gray-400">
           <p>Thank you for your business!</p>
        </div>

      </div>
    </div>
  );
}