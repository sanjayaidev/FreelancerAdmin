'use client';
import { useEffect, useState } from 'react';
import { formatCurrency, STATUS_COLORS, PAYMENT_COLORS, PRIORITY_COLORS } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { CheckCircle, Clock, Loader, Eye, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';

interface WorkItem {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  amount: string;
  paymentStatus: string;
  clientName: string;
  clientSlug: string;
  clientId: number;
}

export default function DashboardPage() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/work-items').then(r => r.json()).then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const stats = {
    pending: items.filter(i => i.status === 'pending').length,
    inProgress: items.filter(i => i.status === 'in-progress').length,
    review: items.filter(i => i.status === 'review').length,
    completed: items.filter(i => i.status === 'completed').length,
    totalAmount: items.reduce((s, i) => s + Number(i.amount || 0), 0),
    paid: items.filter(i => i.paymentStatus === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0),
    partial: items.filter(i => i.paymentStatus === 'partial').reduce((s, i) => s + Number(i.amount || 0), 0),
    unpaid: items.filter(i => i.paymentStatus === 'unpaid').reduce((s, i) => s + Number(i.amount || 0), 0),
  };

  const overdue = items.filter(i => i.dueDate && new Date(i.dueDate) < new Date() && i.status !== 'completed');

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of all projects and payments</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400"><Loader size={16} className="animate-spin" /> Loading...</div>
      ) : (
        <>
          {/* Work Status Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'In Progress', value: stats.inProgress, icon: Loader, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'In Review', value: stats.review, icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">{card.label}</span>
                  <div className={`w-8 h-8 ${card.bg} rounded-lg flex items-center justify-center`}>
                    <card.icon size={15} className={card.color} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Payment Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Billed', value: stats.totalAmount, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Collected', value: stats.paid, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Outstanding', value: stats.unpaid + stats.partial, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">{card.label}</span>
                  <div className={`w-8 h-8 ${card.bg} rounded-lg flex items-center justify-center`}>
                    <card.icon size={15} className={card.color} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(card.value)}</p>
              </div>
            ))}
          </div>

          {/* Overdue Alert */}
          {overdue.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">{overdue.length} overdue task{overdue.length > 1 ? 's' : ''}</p>
                <p className="text-xs text-red-600 mt-0.5">{overdue.map(i => i.title).join(', ')}</p>
              </div>
            </div>
          )}

          {/* Recent Work Items */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-sm">All Tasks</h2>
              <Link href="/tasks" className="text-xs text-indigo-600 hover:underline">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left">Task</th>
                    <th className="px-5 py-3 text-left">Client</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Priority</th>
                    <th className="px-5 py-3 text-left">Due</th>
                    <th className="px-5 py-3 text-left">Amount</th>
                    <th className="px-5 py-3 text-left">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.slice(0, 20).map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900 max-w-[200px] truncate">{item.title}</td>
                      <td className="px-5 py-3 text-gray-500">{item.clientName || '—'}</td>
                      <td className="px-5 py-3">
                        <Badge className={STATUS_COLORS[item.status]}>{item.status}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge className={PRIORITY_COLORS[item.priority]}>{item.priority}</Badge>
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-5 py-3 text-gray-700">{formatCurrency(item.amount)}</td>
                      <td className="px-5 py-3">
                        <Badge className={PAYMENT_COLORS[item.paymentStatus]}>{item.paymentStatus}</Badge>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">No tasks yet. <Link href="/tasks" className="text-indigo-600 hover:underline">Add one →</Link></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
