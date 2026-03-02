import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Event, TicketTier } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

export const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  
  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      api.getEvent(id).then(data => {
        if (data) setEvent(data);
        setLoading(false);
      });
    }
  }, [id]);

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !selectedTier) return;
    if (!guestName || !guestEmail) {
      setError('Please fill in all fields');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const tickets = await api.buyTicket(event.id, selectedTier.id, guestName, guestEmail, quantity, user?.id);
      navigate(`/ticket/${tickets[0].id}`, { state: { success: true, count: tickets.length } });
    } catch (err: any) {
      setError(err.message || 'Failed to purchase ticket');
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!event) return <div className="text-center py-20 text-xl text-zinc-400">Event not found</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black text-white"
    >
      {/* Hero Section */}
      <div className="relative h-[70vh] w-full overflow-hidden">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          src={event.imageUrl} 
          alt={event.title} 
          className="w-full h-full object-cover opacity-60"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <span className="px-4 py-1.5 rounded-full bg-indigo-500 text-xs font-bold uppercase tracking-widest">Live Event</span>
                <span className="text-zinc-400 text-sm font-bold uppercase tracking-widest">{format(new Date(event.date), 'EEEE, MMMM d')}</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 max-w-4xl leading-[0.9]">{event.title}</h1>
              
              <div className="flex flex-wrap gap-8 text-lg font-medium text-zinc-300">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-indigo-400" />
                  <span>{format(new Date(event.date), 'h:mm a')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-indigo-400" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-indigo-400" />
                  <span>{event.capacity.toLocaleString()} Capacity</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          {/* Left Column: Content */}
          <div className="lg:col-span-7 space-y-20">
            <section>
              <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-500 mb-8">About the Event</h2>
              <p className="text-2xl text-zinc-300 leading-relaxed font-light">{event.description}</p>
            </section>

            {event.lineup && event.lineup.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-500 mb-10">Lineup</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {event.lineup.map((artist, idx) => (
                    <div key={idx} className="group cursor-default">
                      <div className="h-px bg-white/10 w-full mb-4 group-hover:bg-indigo-500 transition-colors" />
                      <p className="text-3xl font-bold tracking-tight group-hover:translate-x-2 transition-transform">{artist}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {event.venueInfo && (
                <section>
                  <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-500 mb-6">Venue Info</h2>
                  <p className="text-zinc-400 leading-relaxed">{event.venueInfo}</p>
                </section>
              )}
              {event.policies && event.policies.length > 0 && (
                <section>
                  <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-500 mb-6">Policies</h2>
                  <ul className="space-y-3">
                    {event.policies.map((policy, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-zinc-400 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        {policy}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>

          {/* Right Column: Checkout Card */}
          <div className="lg:col-span-5">
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 sticky top-24 shadow-2xl">
              <h2 className="text-3xl font-bold mb-10">Secure Tickets</h2>
              
              <div className="space-y-4 mb-10">
                {event.tiers.map(tier => {
                  const isSoldOut = tier.sold >= tier.capacity;
                  const isExpired = tier.expiresAt && new Date(tier.expiresAt) < new Date();
                  const isSelected = selectedTier?.id === tier.id;
                  
                  return (
                    <button
                      key={tier.id}
                      onClick={() => !isSoldOut && !isExpired && setSelectedTier(tier)}
                      disabled={isSoldOut || isExpired}
                      className={clsx(
                        "w-full text-left p-6 rounded-3xl border transition-all flex items-center justify-between group",
                        (isSoldOut || isExpired) ? "opacity-40 cursor-not-allowed border-white/5 bg-zinc-950" :
                        isSelected ? "border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/50" : "border-white/10 hover:border-white/30 bg-zinc-950/50"
                      )}
                    >
                      <div>
                        <h3 className="font-bold text-xl mb-1">{tier.name}</h3>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                          {isSoldOut ? 'Sold Out' : isExpired ? 'Expired' : `${tier.capacity - tier.sold} remaining`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold tracking-tighter">${tier.price}</p>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-500 mt-2 ml-auto" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {selectedTier && (
                  <motion.form 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="space-y-8"
                    onSubmit={handleBuy}
                  >
                    <div className="h-px bg-white/5 w-full" />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg">Quantity</h3>
                        <p className="text-xs text-zinc-500">Max 10 per order</p>
                      </div>
                      <div className="flex items-center gap-6 bg-black p-2 rounded-2xl border border-white/10">
                        <button 
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-2xl font-light transition-colors"
                        >-</button>
                        <span className="w-6 text-center font-bold text-xl">{quantity}</span>
                        <button 
                          type="button"
                          onClick={() => setQuantity(Math.min(10, quantity + 1))}
                          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-2xl font-light transition-colors"
                        >+</button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-[0.2em]">Full Name</label>
                        <input
                          type="text"
                          required
                          value={guestName}
                          onChange={e => setGuestName(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                          placeholder="John Doe"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-[0.2em]">Email Address</label>
                        <input
                          type="email"
                          required
                          value={guestEmail}
                          onChange={e => setGuestEmail(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-medium">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full bg-white text-black font-bold text-xl py-5 rounded-[1.5rem] hover:bg-indigo-500 hover:text-white transition-all shadow-xl shadow-white/5 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isProcessing ? (
                        <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span>Complete Order</span>
                          <span className="text-zinc-400 font-light">|</span>
                          <span>${(selectedTier.price * quantity).toLocaleString()}</span>
                        </>
                      )}
                    </button>
                    <p className="text-center text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Encrypted & Secure Checkout</p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
