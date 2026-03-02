import { Event, Ticket, User } from '../types';

const INITIAL_EVENTS: Event[] = [
  {
    id: 'evt_1',
    title: 'Neon Nights Festival',
    description: 'The ultimate electronic music experience under the neon lights.',
    date: '2026-08-15T20:00:00Z',
    location: 'Cyber Arena, Neo City',
    capacity: 5000,
    imageUrl: 'https://images.unsplash.com/photo-1540039155732-68473638epc?auto=format&fit=crop&q=80&w=1000',
    tiers: [
      { id: 't_1', name: 'Early Bird', price: 45, capacity: 1000, sold: 1000, expiresAt: '2026-06-01T00:00:00Z' },
      { id: 't_2', name: 'General Admission', price: 75, capacity: 3500, sold: 1200 },
      { id: 't_3', name: 'VIP', price: 150, capacity: 500, sold: 450 },
    ],
  },
  {
    id: 'evt_2',
    title: 'Tech Innovators Summit',
    description: 'Gathering the brightest minds in technology and design.',
    date: '2026-09-10T09:00:00Z',
    location: 'Innovation Center, Silicon Valley',
    capacity: 1000,
    imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=1000',
    tiers: [
      { id: 't_4', name: 'Standard Pass', price: 299, capacity: 800, sold: 300 },
      { id: 't_5', name: 'All-Access Pass', price: 599, capacity: 200, sold: 150 },
    ],
  }
];

const INITIAL_USERS: User[] = [
  { id: 'usr_admin', name: 'Admin', email: 'admin@gravity.com', role: 'admin', password: 'password' },
  { id: 'usr_staff', name: 'Door Staff 1', email: 'staff@gravity.com', role: 'staff', password: 'password' },
  { id: 'usr_client', name: 'John Doe', email: 'john@example.com', role: 'client', password: 'password' },
];

export const db = {
  getEvents: (): Event[] => {
    const data = localStorage.getItem('gravity_events');
    if (!data) {
      localStorage.setItem('gravity_events', JSON.stringify(INITIAL_EVENTS));
      return INITIAL_EVENTS;
    }
    return JSON.parse(data);
  },
  saveEvents: (events: Event[]) => {
    localStorage.setItem('gravity_events', JSON.stringify(events));
  },
  getUsers: (): User[] => {
    const data = localStorage.getItem('gravity_users');
    if (!data) {
      localStorage.setItem('gravity_users', JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(data);
  },
  saveUsers: (users: User[]) => {
    localStorage.setItem('gravity_users', JSON.stringify(users));
  },
  getTickets: (): Ticket[] => {
    const data = localStorage.getItem('gravity_tickets');
    return data ? JSON.parse(data) : [];
  },
  saveTickets: (tickets: Ticket[]) => {
    localStorage.setItem('gravity_tickets', JSON.stringify(tickets));
  },
  reset: () => {
    localStorage.removeItem('gravity_events');
    localStorage.removeItem('gravity_users');
    localStorage.removeItem('gravity_tickets');
  }
};
