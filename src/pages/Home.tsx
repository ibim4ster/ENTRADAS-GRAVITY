import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Event } from '../types';
import { api } from '../services/api';
import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

export const Home: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEvents().then(data => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <div className="mb-12">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
          Discover <br /> Experiences
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl">
          Get your tickets instantly. No accounts required to buy. Just pure, frictionless access to the best events.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event, i) => (
          <motion.div 
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative bg-zinc-900/50 border border-white/10 rounded-3xl overflow-hidden hover:border-indigo-500/50 transition-colors"
          >
            <div className="aspect-[4/3] overflow-hidden relative">
              <img 
                src={event.imageUrl} 
                alt={event.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <div className="bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-medium">{format(new Date(event.date), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-2xl font-bold tracking-tight mb-2 group-hover:text-indigo-400 transition-colors">
                {event.title}
              </h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-zinc-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{event.location}</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-400">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{event.capacity} Capacity</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Starting from</p>
                  <p className="text-2xl font-bold">${Math.min(...event.tiers.map(t => t.price))}</p>
                </div>
                <Link 
                  to={`/event/${event.id}`}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-black hover:bg-indigo-500 hover:text-white transition-all group-hover:scale-110"
                >
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
