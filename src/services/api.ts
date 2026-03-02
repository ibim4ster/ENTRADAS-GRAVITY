import { Event, Ticket, User, ScanResult } from '../types';
import { db } from './db';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  getEvents: async (): Promise<Event[]> => {
    await delay(300);
    return db.getEvents();
  },
  
  getEvent: async (id: string): Promise<Event | undefined> => {
    await delay(200);
    return db.getEvents().find(e => e.id === id);
  },

  createEvent: async (data: Omit<Event, 'id'>): Promise<Event> => {
    await delay(400);
    const events = db.getEvents();
    const newEvent: Event = {
      ...data,
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
    };
    events.push(newEvent);
    db.saveEvents(events);
    return newEvent;
  },

  updateEvent: async (id: string, data: Partial<Event>): Promise<Event> => {
    await delay(400);
    const events = db.getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Event not found');
    events[index] = { ...events[index], ...data };
    db.saveEvents(events);
    return events[index];
  },

  deleteEvent: async (id: string): Promise<void> => {
    await delay(400);
    const events = db.getEvents();
    const filtered = events.filter(e => e.id !== id);
    db.saveEvents(filtered);
  },

  getAllUsers: async (): Promise<User[]> => {
    await delay(200);
    return db.getUsers();
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    await delay(300);
    const users = db.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    users[index] = { ...users[index], ...data };
    db.saveUsers(users);
    return users[index];
  },

  getTicket: async (id: string): Promise<Ticket | undefined> => {
    await delay(200);
    return db.getTickets().find(t => t.id === id);
  },

  buyTicket: async (
    eventId: string, 
    tierId: string, 
    guestName: string, 
    guestEmail: string,
    quantity: number = 1,
    userId?: string
  ): Promise<Ticket[]> => {
    await delay(800);
    const events = db.getEvents();
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) throw new Error('Event not found');
    
    const event = events[eventIndex];
    const tierIndex = event.tiers.findIndex(t => t.id === tierId);
    if (tierIndex === -1) throw new Error('Tier not found');
    
    const tier = event.tiers[tierIndex];
    
    // Dynamic Pricing / Expiry Check
    if (tier.expiresAt && new Date(tier.expiresAt) < new Date()) {
      throw new Error('This ticket tier has expired');
    }

    if (tier.sold + quantity > tier.capacity) {
      throw new Error(`Not enough tickets available. Only ${tier.capacity - tier.sold} left.`);
    }

    // Update sold count
    events[eventIndex].tiers[tierIndex].sold += quantity;
    db.saveEvents(events);

    const newTickets: Ticket[] = [];
    const tickets = db.getTickets();

    for (let i = 0; i < quantity; i++) {
      const ticketId = `tkt_${Math.random().toString(36).substr(2, 9)}`;
      const signature = btoa(`${ticketId}-${eventId}-gravity-secret-${i}`);

      const newTicket: Ticket = {
        id: ticketId,
        eventId,
        tierId,
        guestName: quantity > 1 ? `${guestName} (${i + 1}/${quantity})` : guestName,
        guestEmail,
        userId,
        status: 'valid',
        signature
      };
      
      newTickets.push(newTicket);
      tickets.push(newTicket);
    }

    db.saveTickets(tickets);

    // Log Audit
    const logs = JSON.parse(localStorage.getItem('gravity_audit_logs') || '[]');
    logs.push({
      id: `log_${Date.now()}`,
      action: 'PURCHASE',
      details: `${quantity} tickets for ${event.title} (${tier.name}) by ${guestEmail}`,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('gravity_audit_logs', JSON.stringify(logs));

    return newTickets;
  },

  getUserTickets: async (email: string): Promise<Ticket[]> => {
    await delay(400);
    return db.getTickets().filter(t => t.guestEmail === email);
  },

  scanTicket: async (signature: string, staffId: string): Promise<ScanResult> => {
    await delay(500);
    const tickets = db.getTickets();
    const ticketIndex = tickets.findIndex(t => t.signature === signature);
    
    if (ticketIndex === -1) {
      return { success: false, message: 'Ticket not found or invalid signature' };
    }

    const ticket = tickets[ticketIndex];
    
    // Check staff assignment
    const users = db.getUsers();
    const staff = users.find(u => u.id === staffId);
    if (staff && staff.role === 'staff') {
      if (!staff.assignedEventIds?.includes(ticket.eventId)) {
        return { success: false, message: 'You are not assigned to this event' };
      }
    }

    if (ticket.status === 'used') {
      return { 
        success: false, 
        message: 'Ticket already scanned', 
        ticket,
        guestName: ticket.guestName
      };
    }

    // Mark as used
    tickets[ticketIndex] = {
      ...ticket,
      status: 'used',
      scannedAt: new Date().toISOString(),
      scannedBy: staffId
    };
    db.saveTickets(tickets);

    return {
      success: true,
      message: 'Valid Ticket',
      ticket: tickets[ticketIndex],
      guestName: ticket.guestName
    };
  }
};
