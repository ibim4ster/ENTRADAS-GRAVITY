import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Event, Ticket, User, Role } from '../types';
import { db } from '../services/db';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Users, 
  Ticket as TicketIcon, 
  DollarSign, 
  Activity, 
  Search, 
  Plus, 
  Edit2, 
  Shield, 
  Calendar as CalendarIcon,
  TrendingUp,
  ArrowRight,
  Trash2,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

type Tab = 'overview' | 'events' | 'users' | 'audit';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Stats calculations
  const totalRevenue = events.reduce((acc, event) => 
    acc + event.tiers.reduce((tAcc, tier) => tAcc + (tier.sold * tier.price), 0), 0
  );
  const totalTicketsSold = events.reduce((acc, event) => 
    acc + event.tiers.reduce((tAcc, tier) => tAcc + tier.sold, 0), 0
  );
  const totalCapacity = events.reduce((acc, event) => acc + event.capacity, 0);
  const scannedTickets = auditLogs.filter(l => l.action === 'TICKET_SCAN' && l.details.includes('Success')).length;

  // Mock chart data based on events
  const chartData = events.map(e => ({
    name: e.title.substring(0, 10),
    sales: e.tiers.reduce((acc, t) => acc + t.sold, 0),
    revenue: e.tiers.reduce((acc, t) => acc + (t.sold * t.price), 0)
  }));

  // Modals state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // New/Edit Event State
  const [eventForm, setEventForm] = useState({
    title: '', description: '', date: '', location: '', capacity: 1000, imageUrl: '',
    tiers: [{ id: 't_1', name: 'General Admission', price: 50, capacity: 1000, sold: 0, expiresAt: '' }],
    lineup: '', policies: '', venueInfo: ''
  });

  const fetchData = async () => {
    const [e, t, u] = await Promise.all([
      api.getEvents(),
      Promise.resolve(db.getTickets()),
      api.getAllUsers()
    ]);
    setEvents(e);
    setTickets(t);
    setUsers(u);
    setAuditLogs(JSON.parse(localStorage.getItem('gravity_audit_logs') || '[]').reverse());
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (editingEvent) {
      setEventForm({
        title: editingEvent.title,
        description: editingEvent.description,
        date: editingEvent.date,
        location: editingEvent.location,
        capacity: editingEvent.capacity,
        imageUrl: editingEvent.imageUrl,
        tiers: editingEvent.tiers.map(t => ({ ...t, expiresAt: t.expiresAt || '' })),
        lineup: editingEvent.lineup?.join('\n') || '',
        policies: editingEvent.policies?.join('\n') || '',
        venueInfo: editingEvent.venueInfo || ''
      });
    } else {
      setEventForm({
        title: '', description: '', date: '', location: '', capacity: 1000, imageUrl: '',
        tiers: [{ id: 't_1', name: 'General Admission', price: 50, capacity: 1000, sold: 0, expiresAt: '' }],
        lineup: '', policies: '', venueInfo: ''
      });
    }
  }, [editingEvent]);

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const eventData = {
      ...eventForm,
      lineup: eventForm.lineup.split('\n').filter(l => l.trim()),
      policies: eventForm.policies.split('\n').filter(p => p.trim()),
      tiers: eventForm.tiers.map(t => ({
        ...t,
        id: t.id || `t_${Math.random().toString(36).substr(2, 9)}`,
        expiresAt: t.expiresAt || undefined
      }))
    };

    if (editingEvent) {
      await api.updateEvent(editingEvent.id, eventData as any);
    } else {
      await api.createEvent(eventData as any);
    }
    
    setIsEventModalOpen(false);
    setEditingEvent(null);
    fetchData();
  };

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      await api.deleteEvent(id);
      fetchData();
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    await api.updateUser(editingUser.id, editingUser);
    setIsUserModalOpen(false);
    setEditingUser(null);
    fetchData();
  };

  const toggleStaffAssignment = (eventId: string) => {
    if (!editingUser) return;
    const currentAssignments = editingUser.assignedEventIds || [];
    const newAssignments = currentAssignments.includes(eventId)
      ? currentAssignments.filter(id => id !== eventId)
      : [...currentAssignments, eventId];
    
    setEditingUser({ ...editingUser, assignedEventIds: newAssignments });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Organizer Dashboard</h1>
          </div>
          <p className="text-zinc-400 text-lg">Manage your events, staff, and attendees with precision.</p>
        </div>
        <div className="flex bg-zinc-900/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 overflow-x-auto">
          {(['overview', 'events', 'users', 'audit'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all whitespace-nowrap",
                activeTab === tab ? "bg-white text-black shadow-xl" : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Stats Grid - Bento Style */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-zinc-900 border border-white/10 p-8 rounded-[2.5rem] md:col-span-2 flex flex-col justify-between group hover:border-emerald-500/50 transition-all duration-500">
              <div className="flex items-center justify-between mb-8">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DollarSign className="w-8 h-8 text-emerald-400" />
                </div>
                <span className="text-emerald-400 text-sm font-bold bg-emerald-500/5 px-3 py-1 rounded-full">+12.5% this month</span>
              </div>
              <div>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-2">Total Revenue</p>
                <h2 className="text-6xl font-bold tracking-tighter">${totalRevenue.toLocaleString()}</h2>
              </div>
            </div>

            <div className="bg-zinc-900 border border-white/10 p-8 rounded-[2.5rem] flex flex-col justify-between hover:border-indigo-500/50 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-8">
                <TicketIcon className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-2">Tickets Sold</p>
                <h2 className="text-5xl font-bold tracking-tighter">{totalTicketsSold.toLocaleString()}</h2>
                <div className="mt-4 w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full" 
                    style={{ width: `${(totalTicketsSold / Math.max(1, totalCapacity)) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-white/10 p-8 rounded-[2.5rem] flex flex-col justify-between hover:border-amber-500/50 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-8">
                <Activity className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-2">Attendance</p>
                <h2 className="text-5xl font-bold tracking-tighter">
                  {totalTicketsSold > 0 ? Math.round((scannedTickets / totalTicketsSold) * 100) : 0}%
                </h2>
                <p className="text-zinc-500 text-sm mt-2">{scannedTickets} scanned in</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="bg-zinc-900 border border-white/10 p-10 rounded-[2.5rem] mb-12">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-bold">Event Performance</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-xs text-zinc-400 font-bold uppercase">Sold</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                  <span className="text-xs text-zinc-400 font-bold uppercase">Capacity</span>
                </div>
              </div>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="#52525b" tick={{ fill: '#71717a', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#18181b', opacity: 0.4 }} 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '16px', padding: '12px' }}
                    itemStyle={{ fontWeight: 700 }}
                  />
                  <Bar dataKey="sold" name="Sold" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                  <Bar dataKey="capacity" name="Capacity" fill="#27272a" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'events' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8 flex justify-between items-center">
            <h2 className="text-3xl font-bold">Manage Events</h2>
            <button 
              onClick={() => { setEditingEvent(null); setIsEventModalOpen(true); }}
              className="flex items-center gap-2 px-6 py-3 bg-white text-black hover:bg-indigo-500 hover:text-white rounded-2xl font-bold transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" /> Create Event
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map(event => (
              <div key={event.id} className="bg-zinc-900 border border-white/10 rounded-[2rem] overflow-hidden group hover:border-white/20 transition-all duration-300 flex flex-col">
                <div className="h-56 relative overflow-hidden">
                  <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={() => { setEditingEvent(event); setIsEventModalOpen(true); }}
                      className="p-3 bg-white/10 backdrop-blur-md hover:bg-white text-white hover:text-black rounded-xl transition-all"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-3 bg-red-500/10 backdrop-blur-md hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                    >
                      <Plus className="w-5 h-5 rotate-45" />
                    </button>
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3">{event.title}</h3>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm mb-6">
                      <CalendarIcon className="w-4 h-4" />
                      {format(new Date(event.date), 'MMM d, yyyy - h:mm a')}
                    </div>
                    
                    <div className="space-y-4 mb-8">
                      {event.tiers.map(t => (
                        <div key={t.id} className="flex items-center justify-between text-sm">
                          <span className="text-zinc-500 font-medium">{t.name}</span>
                          <span className="font-bold">${t.price} • {t.sold}/{t.capacity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                    <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                      <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                        +12
                      </div>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Attendees</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'users' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-3xl font-bold">User Directory</h2>
            <div className="relative w-full sm:w-96">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:border-indigo-500 transition-all text-sm font-medium"
              />
            </div>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950/50 text-zinc-500">
                  <tr>
                    <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px]">User</th>
                    <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px]">Access Level</th>
                    <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px]">Assignments</th>
                    <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())).map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-indigo-400 transition-colors">{u.name}</p>
                            <p className="text-zinc-500 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={clsx(
                          "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                          u.role === 'admin' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                          u.role === 'staff' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                        )}>
                          {u.role === 'admin' && <Shield className="w-3 h-3 mr-1.5" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-zinc-400 text-xs font-medium">
                          {u.role === 'staff' ? `${u.assignedEventIds?.length || 0} Events` : 'N/A'}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }}
                          className="p-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'audit' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-3xl font-bold mb-8">Security Audit</h2>
          <div className="bg-zinc-900 border border-white/10 rounded-[2rem] overflow-hidden">
            <div className="divide-y divide-white/5">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-6 hover:bg-white/[0.02] transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <div className={clsx(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                      log.action === 'PURCHASE' ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-500/10 text-zinc-400"
                    )}>
                      {log.action === 'PURCHASE' ? <TicketIcon className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
                          log.action === 'PURCHASE' ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-500/20 text-zinc-400"
                        )}>
                          {log.action}
                        </span>
                        <span className="text-zinc-500 text-xs font-medium">{format(new Date(log.timestamp), 'MMM d, h:mm:ss a')}</span>
                      </div>
                      <p className="text-zinc-200 font-medium">{log.details}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="p-20 text-center">
                  <Activity className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                  <p className="text-zinc-500 font-bold">No security events recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Create/Edit Event Modal */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-900 border border-white/10 rounded-[2.5rem] p-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-bold">{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
                <button onClick={() => setIsEventModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <Plus className="w-8 h-8 rotate-45 text-zinc-500" />
                </button>
              </div>
              
              <form onSubmit={handleSaveEvent} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Basic Information</h3>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Event Title</label>
                      <input required type="text" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4 focus:border-indigo-500 outline-none transition-all font-medium" placeholder="e.g. Gravity Music Festival" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Date & Time</label>
                      <input required type="datetime-local" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4 focus:border-indigo-500 outline-none transition-all font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Location</label>
                      <input required type="text" value={eventForm.location} onChange={e => setEventForm({...eventForm, location: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4 focus:border-indigo-500 outline-none transition-all font-medium" placeholder="e.g. Madison Square Garden" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Image URL</label>
                      <input required type="url" value={eventForm.imageUrl} onChange={e => setEventForm({...eventForm, imageUrl: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4 focus:border-indigo-500 outline-none transition-all font-medium" placeholder="https://..." />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Extended Details</h3>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Description</label>
                      <textarea required value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4 focus:border-indigo-500 outline-none transition-all font-medium resize-none" rows={4} placeholder="Tell people about your event..." />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Lineup (one per line)</label>
                      <textarea value={eventForm.lineup} onChange={e => setEventForm({...eventForm, lineup: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4 focus:border-indigo-500 outline-none transition-all font-medium resize-none" rows={3} placeholder="Artist Name 1&#10;Artist Name 2" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Venue Info</label>
                      <input type="text" value={eventForm.venueInfo} onChange={e => setEventForm({...eventForm, venueInfo: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4 focus:border-indigo-500 outline-none transition-all font-medium" placeholder="Parking, accessibility, etc." />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Ticket Tiers</h3>
                    <button 
                      type="button"
                      onClick={() => setEventForm({...eventForm, tiers: [...eventForm.tiers, { id: '', name: 'New Tier', price: 0, capacity: 100, sold: 0, expiresAt: '' }]})}
                      className="text-indigo-400 text-xs font-bold hover:text-indigo-300 uppercase tracking-widest"
                    >
                      + Add Tier
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {eventForm.tiers.map((tier, idx) => (
                      <div key={idx} className="bg-zinc-950 p-6 rounded-3xl border border-white/5 relative group">
                        <button 
                          type="button"
                          onClick={() => setEventForm({...eventForm, tiers: eventForm.tiers.filter((_, i) => i !== idx)})}
                          className="absolute top-4 right-4 p-1 text-zinc-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Plus className="w-5 h-5 rotate-45" />
                        </button>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className="block text-[10px] text-zinc-500 mb-1 uppercase font-bold tracking-widest">Tier Name</label>
                            <input type="text" value={tier.name} onChange={e => {
                              const updated = [...eventForm.tiers];
                              updated[idx].name = e.target.value;
                              setEventForm({...eventForm, tiers: updated});
                            }} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-all font-bold" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 mb-1 uppercase font-bold tracking-widest">Price ($)</label>
                            <input type="number" value={tier.price} onChange={e => {
                              const updated = [...eventForm.tiers];
                              updated[idx].price = Number(e.target.value);
                              setEventForm({...eventForm, tiers: updated});
                            }} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-all font-bold" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 mb-1 uppercase font-bold tracking-widest">Capacity</label>
                            <input type="number" value={tier.capacity} onChange={e => {
                              const updated = [...eventForm.tiers];
                              updated[idx].capacity = Number(e.target.value);
                              setEventForm({...eventForm, tiers: updated});
                            }} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-all font-bold" />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[10px] text-zinc-500 mb-1 uppercase font-bold tracking-widest">Expiry Date</label>
                            <input type="datetime-local" value={tier.expiresAt} onChange={e => {
                              const updated = [...eventForm.tiers];
                              updated[idx].expiresAt = e.target.value;
                              setEventForm({...eventForm, tiers: updated});
                            }} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-all font-bold" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-10 border-t border-white/5">
                  <button type="button" onClick={() => setIsEventModalOpen(false)} className="px-8 py-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-all font-bold">Cancel</button>
                  <button type="submit" className="px-10 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all shadow-xl shadow-indigo-500/20">
                    {editingEvent ? 'Update Event' : 'Launch Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {isUserModalOpen && editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-900 border border-white/10 rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-bold">Manage User Access</h2>
                <button onClick={() => setIsUserModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <Plus className="w-8 h-8 rotate-45 text-zinc-500" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateUser} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Full Name</label>
                    <input required type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4 focus:border-indigo-500 outline-none transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Email Address</label>
                    <input required type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4 focus:border-indigo-500 outline-none transition-all font-medium" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Role</label>
                    <div className="grid grid-cols-3 gap-4">
                      {(['client', 'staff', 'admin'] as Role[]).map(role => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setEditingUser({...editingUser, role})}
                          className={clsx(
                            "py-4 rounded-2xl border font-bold capitalize transition-all",
                            editingUser.role === role ? "bg-indigo-500 border-indigo-500 text-white" : "bg-zinc-950 border-white/10 text-zinc-500 hover:border-white/30"
                          )}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {editingUser.role === 'staff' && (
                  <div className="space-y-4 pt-6 border-t border-white/5">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Assigned Events</h3>
                    <p className="text-xs text-zinc-500 mb-4">Staff members can only scan tickets for assigned events.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {events.map(event => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => toggleStaffAssignment(event.id)}
                          className={clsx(
                            "p-4 rounded-2xl border text-left transition-all flex items-center justify-between group",
                            editingUser.assignedEventIds?.includes(event.id) ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-zinc-950 border-white/10 text-zinc-500 hover:border-white/30"
                          )}
                        >
                          <span className="text-xs font-bold truncate">{event.title}</span>
                          {editingUser.assignedEventIds?.includes(event.id) && <Shield className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-8 border-t border-white/5">
                  <button type="button" onClick={() => { setIsUserModalOpen(false); setEditingUser(null); }} className="px-8 py-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-all font-bold">Cancel</button>
                  <button type="submit" className="px-10 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all shadow-xl shadow-indigo-500/20">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
