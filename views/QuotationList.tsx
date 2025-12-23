import React from 'react';
import { QuotationData, User } from '../types';
import { PlusIcon, ClipboardListIcon, EyeIcon, DownloadIcon, EditIcon } from '../components/Icons';

interface QuotationListProps {
  quotations: QuotationData[];
  currency: string;
  onCreate: () => void;
  onEdit: (quotation: QuotationData) => void;
  onView: (quotation: QuotationData) => void;
  onDownload: (quotation: QuotationData) => void;
  currentUser: User;
}

export default function QuotationList({ quotations, currency, onCreate, onEdit, onView, onDownload, currentUser }: QuotationListProps) {
  const isViewer = currentUser.role === 'viewer';

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Quotations</h1>
        {!isViewer && (
          <button
            onClick={onCreate}
            className="flex items-center gap-2 px-4 py-2 bg-sandpix-600 text-white rounded-lg hover:bg-sandpix-700 transition-colors font-medium text-sm w-full sm:w-auto justify-center"
          >
            <PlusIcon className="w-4 h-4" />
            Create Quotation
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 min-w-[800px]">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-3">Quote #</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Valid Until</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotations.map((q) => {
                 const total = q.items.reduce((s, item) => s + item.quantity * item.rate, 0) * (1 + q.taxRate/100);
                 return (
                  <tr key={q.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900">{q.quotationNumber}</td>
                    <td className="px-6 py-4">{q.clientName || <span className="text-gray-400 italic">No Client</span>}</td>
                    <td className="px-6 py-4">{q.date}</td>
                    <td className="px-6 py-4">{q.validUntil}</td>
                    <td className="px-6 py-4 font-medium">{currency}{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${q.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                          q.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                          q.status === 'sent' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => onView(q)} className="text-gray-500 hover:text-gray-700 p-1.5 hover:bg-gray-100 rounded transition-colors" title="View Quote"><EyeIcon className="w-4 h-4" /></button>
                      <button onClick={() => onDownload(q)} className="text-gray-500 hover:text-gray-700 p-1.5 hover:bg-gray-100 rounded transition-colors" title="Download"><DownloadIcon className="w-4 h-4" /></button>
                      {!isViewer && (
                        <button onClick={() => onEdit(q)} className="text-sandpix-600 hover:text-sandpix-800 font-medium text-xs border border-sandpix-200 rounded px-2 py-1 bg-sandpix-50 flex items-center gap-1">
                          <EditIcon className="w-3 h-3" /> Edit
                        </button>
                      )}
                    </td>
                  </tr>
                 );
              })}
              {quotations.length === 0 && (
                <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                     <div className="flex flex-col items-center gap-2">
                       <ClipboardListIcon className="w-8 h-8 opacity-20" />
                       <p>No quotations yet.</p>
                     </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}