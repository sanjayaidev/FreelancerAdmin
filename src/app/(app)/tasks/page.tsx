'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Filter, CheckSquare } from 'lucide-react';
import { STATUS_COLORS, PAYMENT_COLORS, PRIORITY_COLORS, formatCurrency, formatDate } from '@/lib/utils';

interface WorkItem {
  id: number;
  clientId: number;
  clientName: string;
  clientSlug: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  amount: string;
  paymentStatus: string;
  createdAt: string;
}

interface Client { id: number; name: string; }

const emptyForm = { clientId: '', title: '', description: '', status: 'pending', priority: 'medium', dueDate: '', amount: '', paymentStatus: 'unpaid' };

export default function TasksPage() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WorkItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/work-items').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
    ]).then(([w, c]) => { setItems(w); setClients(c); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (i: WorkItem) => {
    setEditing(i);
    setForm({
      clientId: String(i.clientId), title: i.title, description: i.description || '',
      status: i.status, priority: i.priority, dueDate: i.dueDate || '',
      amount: i.amount || '', paymentStatus: i.paymentStatus,
    });
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/work-items/${editing.id}` : '/api/work-items';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false);
    setModalOpen(false);
    load();
  };

  const remove = async (id: number) => {
    await fetch(`/api/work-items/${id}`, { method: 'DELETE' });
    setDeleteId(null);
    load();
  };

  const filtered = items.filter(i => {
    if (filterStatus !== 'all' && i.status !== filterStatus) return false;
    if (filterPayment !== 'all' && i.paymentStatus !== filterPayment) return false;
    if (filterClient !== 'all' && String(i.clientId) !== filterClient) return false;
    return true;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} of {items.length} tasks</p>
        </div>
        <Button onClick={openCreate}><Plus size={15} /> Add Task</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Filter size={14} className="text-gray-400" />
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="all">All Clients</option>
          {clients.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="all">All Statuses</option>
          {['pending','in-progress','review','completed'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="all">All Payments</option>
          {['unpaid','partial','paid'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filterStatus !== 'all' || filterClient !== 'all' || filterPayment !== 'all') && (
          <button onClick={() => { setFilterStatus('all'); setFilterClient('all'); setFilterPayment('all'); }} className="text-xs text-gray-400 hover:text-gray-700 underline">Clear</button>
        )}
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <CheckSquare size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No tasks found</p>
          <Button className="mt-4" onClick={openCreate}><Plus size={14} /> Add a task</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left">Task</th>
                  <th className="px-5 py-3 text-left">Client</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Priority</th>
                  <th className="px-5 py-3 text-left">Due</th>
                  <th className="px-5 py-3 text-left">Amount</th>
                  <th className="px-5 py-3 text-left">Payment</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900 max-w-[200px] truncate">{item.title}</p>
                      {item.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{item.description}</p>}
                    </td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{item.clientName || '—'}</td>
                    <td className="px-5 py-3"><Badge className={STATUS_COLORS[item.status]}>{item.status}</Badge></td>
                    <td className="px-5 py-3"><Badge className={PRIORITY_COLORS[item.priority]}>{item.priority}</Badge></td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                      {item.dueDate ? (
                        <span className={new Date(item.dueDate) < new Date() && item.status !== 'completed' ? 'text-red-600 font-medium' : ''}>
                          {new Date(item.dueDate).toLocaleDateString('en-IN')}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-700 whitespace-nowrap">{formatCurrency(item.amount)}</td>
                    <td className="px-5 py-3"><Badge className={PAYMENT_COLORS[item.paymentStatus]}>{item.paymentStatus}</Badge></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Pencil size={13} /></button>
                        <button onClick={() => setDeleteId(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Task' : 'Add Task'} size="lg">
        <div className="flex flex-col gap-4">
          <Select
            label="Client *"
            value={form.clientId}
            onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
            options={[{ value: '', label: 'Select client...' }, ...clients.map(c => ({ value: String(c.id), label: c.name }))]}
          />
          <Input label="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" />
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What needs to be done?" />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Status"
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              options={['pending','in-progress','review','completed'].map(s => ({ value: s, label: s }))}
            />
            <Select
              label="Priority"
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              options={['low','medium','high','urgent'].map(s => ({ value: s, label: s }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Due Date" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            <Input label="Amount (₹)" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
          </div>
          <Select
            label="Payment Status"
            value={form.paymentStatus}
            onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value }))}
            options={[{ value: 'unpaid', label: 'Unpaid' }, { value: 'partial', label: 'Partial' }, { value: 'paid', label: 'Paid' }]}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.clientId || !form.title || saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Task" size="sm">
        <p className="text-sm text-gray-600 mb-5">This will permanently delete this task. This cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => remove(deleteId!)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
