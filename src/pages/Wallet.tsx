import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Ticket, Event } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Ticket as TicketIcon, Calendar, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export const Wallet: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<(Ticket & { event?: Event })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchTickets = async () => {
      const userTickets = await api.getUserTickets(user.email);
      
      const ticketsWithEvents = await Promise.all(
        userTickets.map(async (t) => {
          const event = await api.getEvent(t.eventId);
          return { ...t, event };
        })
      );
      
      setTickets(ticketsWithEvents);
      setLoading(false);
    };

    fetchTickets();
  }, [user]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">My Wallet</h1>
        <p className="text-xl text-zinc-400">Manage your tickets and upcoming events.</p>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-white/5">
          <TicketIcon className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No tickets yet</h2>
          <p className="text-zinc-400 mb-6">Looks like you haven't purchased any tickets.</p>
          <Link to="/" className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket, i) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link 
                to={`/ticket/${ticket.id}`}
                className="block bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden hover:border-indigo-500/50 transition-colors group"
              >
                <div className="h-32 relative">
                  {ticket.event && (
                    <img 
                      src={ticket.event.imageUrl} 
                      alt={ticket.event.title} 
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold truncate">{ticket.event?.title}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-zinc-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {ticket.event ? format(new Date(ticket.event.date), 'MMM d, yyyy - h:mm a') : 'TBD'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm truncate">{ticket.event?.location}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Status</p>
                      <p className={`font-bold ${ticket.status === 'valid' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {ticket.status.toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Ticket ID</p>
                      <p className="font-mono text-sm text-zinc-300">{ticket.id.split('_')[1]}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
