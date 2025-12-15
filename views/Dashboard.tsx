import React from 'react';
import { InvoiceData, User } from '../types';
import { FileTextIcon, UsersIcon, BarChartIcon } from '../components/Icons';

interface DashboardProps {
  invoices: InvoiceData[];
  users: User[];
  currency: string;
}

export default function Dashboard({ invoices, users, currency }: DashboardProps) {
  const totalRevenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, inv) => {
      const sub = inv.items.reduce((s, item) => s + item.quantity * item.rate, 0);
      return sum + sub + (sub * (inv.taxRate / 100));
    }, 0);

  const pendingAmount = invoices
    .filter(i => i.status === 'pending')
    .reduce((sum, inv) => {
      const sub = inv.items.reduce((s, item) => s + item.quantity * item.rate, 0);
      return sum + sub + (sub * (inv.taxRate / 100));
    }, 0);

  const recentInvoices = [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>
      
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
            <h2 className="text-3xl font-bold text-gray-900">{currency}{totalRevenue.toLocaleString()}</h2>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-green-600">
             <BarChartIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Pending Invoices</p>
            <h2 className="text-3xl font-bold text-gray-900">{currency}{pendingAmount.toLocaleString()}</h2>
            <p className="text-xs text-orange-500 mt-1">{invoices.filter(i => i.status === 'pending').length} invoices waiting</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
             <FileTextIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Clients</p>
            <h2 className="text-3xl font-bold text-gray-900">{new Set(invoices.map(i => i.clientName)).size}</h2>
            <p className="text-xs text-blue-500 mt-1">{users.length} system users</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
             <UsersIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Recent Invoices</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-3">Invoice #</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentInvoices.map((inv) => {
                 const total = inv.items.reduce((s, item) => s + item.quantity * item.rate, 0) * (1 + inv.taxRate/100);
                 return (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4">{inv.clientName || 'N/A'}</td>
                    <td className="px-6 py-4">{inv.date}</td>
                    <td className="px-6 py-4">{currency}{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : 
                          inv.status === 'pending' ? 'bg-orange-100 text-orange-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                 );
              })}
              {recentInvoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No recent invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}