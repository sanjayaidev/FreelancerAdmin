'use client';
import { useEffect, useState } from 'react';
import { use } from 'react';

interface WorkItem {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  amount: string;
  paymentStatus: string;
}

interface ShareData {
  client: { name: string; company: string; email: string; slug: string };
  summary: { totalAmount: number; paidAmount: number; partialAmount: number; unpaidAmount: number; totalItems: number };
  items: WorkItem[];
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  review: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
};

const PAYMENT_STYLES: Record<string, string> = {
  unpaid: 'bg-red-100 text-red-800',
  partial: 'bg-orange-100 text-orange-800',
  paid: 'bg-green-100 text-green-800',
};

const ALL_STATUSES = ['pending', 'in-progress', 'review', 'completed'];

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
}

export default function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (selectedStatuses.length > 0) params.set('statuses', selectedStatuses.join(','));
    fetch(`/api/share/${slug}?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, [slug]);

  const toggleStatus = (s: string) => {
    setSelectedStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-2xl mb-2">🔍</p>
        <p className="text-gray-600 font-medium">{error}</p>
        <p className="text-gray-400 text-sm mt-1">Check the link and try again</p>
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">PM</span>
                </div>
                <span className="text-gray-400 text-sm">ClientPM</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{data.client.name}</h1>
              {data.client.company && <p className="text-gray-500 mt-0.5">{data.client.company}</p>}
              {data.client.email && <p className="text-gray-400 text-sm mt-0.5">{data.client.email}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Total Billed</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{fmt(data.summary.totalAmount)}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Filter Tasks</h2>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">From</label>
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">To</label>
                <input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Task Status</label>
              <div className="flex flex-wrap gap-2">
                {ALL_STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleStatus(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selectedStatuses.includes(s)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={load}
              className="bg-indigo-600 text-white rounded-lg py-2 px-4 text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Paid', value: data.summary.paidAmount, color: 'text-green-700', bg: 'bg-green-50 border-green-100' },
            { label: 'Partial', value: data.summary.partialAmount, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-100' },
            { label: 'Unpaid', value: data.summary.unpaidAmount, color: 'text-red-700', bg: 'bg-red-50 border-red-100' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border rounded-xl p-4`}>
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{fmt(s.value)}</p>
            </div>
          ))}
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{data.summary.totalItems} Task{data.summary.totalItems !== 1 ? 's' : ''}</h2>
          </div>
          {data.items.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">No tasks match your filters</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.items.map(item => (
                <div key={item.id} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    {item.description && <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[item.status]}`}>{item.status}</span>
                      {item.dueDate && <span className="text-xs text-gray-400">Due {new Date(item.dueDate).toLocaleDateString('en-IN')}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {item.amount && <p className="font-semibold text-gray-900">{fmt(Number(item.amount))}</p>}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${PAYMENT_STYLES[item.paymentStatus]}`}>{item.paymentStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {data.items.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">Total Due</span>
              <span className="font-bold text-gray-900">{fmt(data.summary.unpaidAmount + data.summary.partialAmount)}</span>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">Powered by ClientPM · This is a read-only view</p>
      </div>
    </div>
  );
}
