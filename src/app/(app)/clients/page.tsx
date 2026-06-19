'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Plus, Pencil, Trash2, ExternalLink, Copy, Check, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  notes: string;
  slug: string;
  createdAt: string;
}

const empty = { name: '', email: '', phone: '', company: '', address: '', notes: '' };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/clients').then(r => r.json()).then(data => { setClients(data); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setModalOpen(true); };
  const openEdit = (c: Client) => { setEditing(c); setForm({ name: c.name, email: c.email || '', phone: c.phone || '', company: c.company || '', address: c.address || '', notes: c.notes || '' }); setModalOpen(true); };

  const save = async () => {
    setSaving(true);
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/clients/${editing.id}` : '/api/clients';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false);
    setModalOpen(false);
    load();
  };

  const remove = async (id: number) => {
    await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    setDeleteId(null);
    load();
  };

  const copyShare = (client: Client) => {
    const url = `${window.location.origin}/share/${client.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(client.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 text-sm mt-1">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate}><Plus size={15} /> Add Client</Button>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Users size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No clients yet</p>
          <Button className="mt-4" onClick={openCreate}><Plus size={14} /> Add your first client</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map(client => (
            <div key={client.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{client.name}</h2>
                  {client.company && <p className="text-xs text-gray-400 mt-0.5">{client.company}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(client)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteId(client.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                {client.email && <p>✉ {client.email}</p>}
                {client.phone && <p>☎ {client.phone}</p>}
                {client.address && <p>📍 {client.address}</p>}
                {client.notes && <p className="text-gray-400 italic line-clamp-2">{client.notes}</p>}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                <a href={`/share/${client.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                  <ExternalLink size={12} /> Share Page
                </a>
                <button onClick={() => copyShare(client)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 ml-auto transition-colors">
                  {copiedId === client.id ? <><Check size={12} className="text-green-500" /> Copied!</> : <><Copy size={12} /> Copy link</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Client' : 'Add Client'} size="md">
        <div className="flex flex-col gap-4">
          <Input label="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Client name" />
          <Input label="Company" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Company name" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@domain.com" />
            <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
          </div>
          <Input label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="City, State" />
          <Textarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Internal notes about this client..." />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.name || saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Client" size="sm">
        <p className="text-sm text-gray-600 mb-5">This will permanently delete the client and all their tasks. This cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => remove(deleteId!)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
