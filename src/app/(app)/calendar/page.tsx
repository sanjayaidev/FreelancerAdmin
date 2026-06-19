'use client';
import { useEffect, useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enIN } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';

const localizer = dateFnsLocalizer({
  format, parse, startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), getDay,
  locales: { 'en-IN': enIN },
});

interface CalEvent {
  id: number;
  title: string;
  description?: string;
  eventDate: string;
  eventType: string;
  workItemId?: number;
  clientId?: number;
  clientName?: string;
  start?: Date;
  end?: Date;
}

interface Client { id: number; name: string; }
interface WorkItem { id: number; title: string; clientId: number; }

const emptyForm = { title: '', description: '', eventDate: '', eventType: 'task', workItemId: '', clientId: '' };

export default function CalendarPage() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [view, setView] = useState<string>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [filterClient, setFilterClient] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CalEvent | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);

  const load = () => {
    Promise.all([
      fetch('/api/calendar').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
      fetch('/api/work-items').then(r => r.json()),
    ]).then(([ev, cl, wi]) => {
      setEvents(ev);
      setClients(cl);
      setWorkItems(wi);
    });
  };

  useEffect(() => { load(); }, []);

  const filteredEvents = events
    .filter(e => filterClient === 'all' || String(e.clientId) === filterClient)
    .map(e => ({
      ...e,
      start: new Date(e.eventDate),
      end: new Date(new Date(e.eventDate).getTime() + 60 * 60 * 1000),
    }));

  const openCreate = (slotDate?: Date) => {
    setEditing(null);
    setForm({
      ...emptyForm,
      eventDate: slotDate ? format(slotDate, "yyyy-MM-dd'T'HH:mm") : '',
    });
    setModalOpen(true);
  };

  const openEdit = (event: CalEvent) => {
    setEditing(event);
    setForm({
      title: event.title,
      description: event.description || '',
      eventDate: format(new Date(event.eventDate), "yyyy-MM-dd'T'HH:mm"),
      eventType: event.eventType,
      workItemId: event.workItemId ? String(event.workItemId) : '',
      clientId: event.clientId ? String(event.clientId) : '',
    });
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/calendar/${editing.id}` : '/api/calendar';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false);
    setModalOpen(false);
    load();
  };

  const remove = async (id: number) => {
    await fetch(`/api/calendar/${id}`, { method: 'DELETE' });
    setModalOpen(false);
    load();
  };

  const clientWorkItems = form.clientId
    ? workItems.filter(wi => String(wi.clientId) === form.clientId)
    : workItems;

  const eventStyleGetter = (event: any) => {
    const colors: Record<string, string> = {
      task: '#6366f1',
      meeting: '#0ea5e9',
      deadline: '#ef4444',
    };
    return {
      style: {
        backgroundColor: colors[event.eventType] || '#6366f1',
        borderRadius: '6px',
        border: 'none',
        color: 'white',
        fontSize: '12px',
        padding: '2px 6px',
      }
    };
  };

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-500 text-sm mt-1">Schedule and track tasks by date</p>
        </div>
        <Button onClick={() => openCreate()}><Plus size={15} /> Add Event</Button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* View switcher */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
          {[Views.DAY, Views.WEEK, Views.MONTH].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm capitalize transition-colors ${view === v ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Nav */}
        <div className="flex items-center gap-1">
          <button onClick={() => setDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; })} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><ChevronLeft size={16} /></button>
          <button onClick={() => setDate(new Date())} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Today</button>
          <button onClick={() => setDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; })} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><ChevronRight size={16} /></button>
        </div>

        {/* Client filter */}
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 ml-auto">
          <option value="all">All Clients</option>
          {clients.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
      </div>

      {/* Calendar */}
      <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          view={view as any}
          date={date}
          onNavigate={setDate}
          onView={setView as any}
          onSelectEvent={(e: any) => openEdit(e)}
          onSelectSlot={(slotInfo: any) => openCreate(slotInfo.start)}
          selectable
          eventPropGetter={eventStyleGetter}
          toolbar={false}
          style={{ height: '100%', padding: '12px' }}
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Event' : 'Add Event'} size="md">
        <div className="flex flex-col gap-4">
          <Input label="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" />
          <Input label="Date & Time *" type="datetime-local" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} />
          <Select
            label="Event Type"
            value={form.eventType}
            onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}
            options={[{ value: 'task', label: '📋 Task' }, { value: 'meeting', label: '🤝 Meeting' }, { value: 'deadline', label: '🔴 Deadline' }]}
          />
          <Select
            label="Client (optional)"
            value={form.clientId}
            onChange={e => setForm(f => ({ ...f, clientId: e.target.value, workItemId: '' }))}
            options={[{ value: '', label: 'No client' }, ...clients.map(c => ({ value: String(c.id), label: c.name }))]}
          />
          {clientWorkItems.length > 0 && (
            <Select
              label="Link to Task (optional)"
              value={form.workItemId}
              onChange={e => setForm(f => ({ ...f, workItemId: e.target.value }))}
              options={[{ value: '', label: 'None' }, ...clientWorkItems.map(w => ({ value: String(w.id), label: w.title }))]}
            />
          )}
          <Input label="Notes" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional notes" />
          <div className="flex justify-between gap-2 mt-2">
            {editing && (
              <Button variant="danger" onClick={() => remove(editing.id)}>Delete</Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={!form.title || !form.eventDate || saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
