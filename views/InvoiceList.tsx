import React from 'react';
import { InvoiceData, User } from '../types';
import { PlusIcon, FileTextIcon, TrashIcon, EyeIcon, DownloadIcon, EditIcon } from '../components/Icons';

interface InvoiceListProps {
  invoices: InvoiceData[];
  currency: string;
  onCreate: () => void;
  onEdit: (invoice: InvoiceData) => void;
  onView: (invoice: InvoiceData) => void;
  onDownload: (invoice: InvoiceData) => void;
  onDelete: (id: string) => void;
  currentUser: User;
}

export default function InvoiceList({ invoices, currency, onCreate, onEdit, onView, onDownload, onDelete, currentUser }: InvoiceListProps) {
  const isViewer = currentUser.role === 'viewer';
  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
        {!isViewer && (
          <button
            onClick={onCreate}
            className="flex items-center gap-2 px-4 py-2 bg-sandpix-600 text-white rounded-lg hover:bg-sandpix-700 transition-colors font-medium text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            Create Invoice
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-3">Number</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => {
                 const total = inv.items.reduce((s, item) => s + item.quantity * item.rate, 0) * (1 + inv.taxRate/100);
                 return (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4">{inv.clientName || <span className="text-gray-400 italic">No Client</span>}</td>
                    <td className="px-6 py-4">{inv.date}</td>
                    <td className="px-6 py-4">{inv.dueDate}</td>
                    <td className="px-6 py-4 font-medium">{currency}{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : 
                          inv.status === 'pending' ? 'bg-orange-100 text-orange-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onView(inv)}
                        className="text-gray-500 hover:text-gray-700 p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title="View Invoice"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDownload(inv)}
                        className="text-gray-500 hover:text-gray-700 p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title="Download PDF"
                      >
                        <DownloadIcon className="w-4 h-4" />
                      </button>
                      
                      {!isViewer && (
                        <button
                          type="button"
                          onClick={() => onEdit(inv)}
                          className="text-sandpix-600 hover:text-sandpix-800 font-medium text-xs border border-sandpix-200 rounded px-2 py-1 bg-sandpix-50 flex items-center gap-1"
                        >
                          <EditIcon className="w-3 h-3" /> Edit
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(inv.id);
                          }}
                          className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                 );
              })}
              {invoices.length === 0 && (
                <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                     <div className="flex flex-col items-center gap-2">
                       <FileTextIcon className="w-8 h-8 opacity-20" />
                       <p>No invoices yet. {isViewer ? '' : 'Create your first one!'}</p>
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