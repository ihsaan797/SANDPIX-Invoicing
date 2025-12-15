import React, { useState } from 'react';
import { InvoiceData } from '../types';
import { PrinterIcon, FileTextIcon } from '../components/Icons';

interface ReportsProps {
  invoices: InvoiceData[];
  currency: string;
}

export default function Reports({ invoices, currency }: ReportsProps) {
  // Default to current month
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    return inv.date >= startDate && inv.date <= endDate;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate stats
  const stats = filteredInvoices.reduce((acc, inv) => {
    const subtotal = inv.items.reduce((s, i) => s + (i.quantity * i.rate), 0);
    const tax = subtotal * (inv.taxRate / 100);
    const total = subtotal + tax;

    acc.count++;
    acc.totalAmount += total;
    if (inv.status === 'paid') acc.collected += total;
    else if (inv.status === 'pending') acc.pending += total;
    else if (inv.status === 'draft') acc.draft += total;

    return acc;
  }, { count: 0, totalAmount: 0, collected: 0, pending: 0, draft: 0 });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      {/* Header & Controls - Hidden on Print */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 no-print">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Financial Reports</h1>
           <p className="text-sm text-gray-500">Generate reports for specific time periods.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold text-gray-400 px-2">From</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm font-medium text-gray-700 focus:outline-none px-2 bg-transparent"
              />
            </div>
            <div className="h-8 w-px bg-gray-200 mx-1"></div>
            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold text-gray-400 px-2">To</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm font-medium text-gray-700 focus:outline-none px-2 bg-transparent"
              />
            </div>
          </div>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-3 bg-sandpix-600 text-white rounded-lg hover:bg-sandpix-700 transition-colors font-medium text-sm shadow-sm"
          >
            <PrinterIcon className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Report Content - Visible in Print */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print-shadow-none print-border-none print-full-width">
        
        {/* Print-only Header */}
        <div className="hidden print:block p-8 border-b border-gray-100">
           <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Report</h1>
           <p className="text-gray-600">Period: {startDate} to {endDate}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100 border-b border-gray-100">
          <div className="p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">{currency}{stats.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Collected</p>
            <p className="text-2xl font-bold text-green-600">{currency}{stats.collected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
           <div className="p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pending</p>
            <p className="text-2xl font-bold text-orange-500">{currency}{stats.pending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
           <div className="p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Invoices</p>
            <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Invoice #</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map(inv => {
                  const subtotal = inv.items.reduce((s, i) => s + (i.quantity * i.rate), 0);
                  const total = subtotal * (1 + inv.taxRate / 100);
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50 print:hover:bg-transparent avoid-break">
                      <td className="px-6 py-4 whitespace-nowrap">{inv.date}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4">{inv.clientName}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase
                          ${inv.status === 'paid' ? 'bg-green-100 text-green-800 print:bg-transparent print:text-gray-800 print:p-0' : 
                            inv.status === 'pending' ? 'bg-orange-100 text-orange-800 print:bg-transparent print:text-gray-800 print:p-0' : 
                            'bg-gray-100 text-gray-800 print:bg-transparent print:text-gray-800 print:p-0'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium whitespace-nowrap">
                        {currency}{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                     <div className="flex flex-col items-center gap-2">
                       <FileTextIcon className="w-8 h-8 opacity-20" />
                       <p>No invoices found for this period.</p>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
            {filteredInvoices.length > 0 && (
               <tfoot className="bg-gray-50 font-bold text-gray-900 border-t border-gray-200 print:bg-gray-100">
                 <tr>
                   <td colSpan={4} className="px-6 py-4 text-right uppercase text-xs tracking-wider">Total</td>
                   <td className="px-6 py-4 text-right whitespace-nowrap">{currency}{stats.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                 </tr>
               </tfoot>
            )}
          </table>
        </div>
      </div>
      
      <div className="mt-8 text-center hidden print:block text-xs text-gray-400">
         Generated by Sandpix Maldives Invoicer on {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}