export type Role = 'guest' | 'client' | 'staff' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  password?: string;
  assignedEventIds?: string[]; // For staff members
}

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  capacity: number;
  sold: number;
  expiresAt?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  imageUrl: string;
  tiers: TicketTier[];
  lineup?: string[];
  policies?: string[];
  venueInfo?: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  userId?: string;
  guestName: string;
  guestEmail: string;
  tierId: string;
  status: 'valid' | 'used';
  scannedAt?: string;
  scannedBy?: string;
  signature: string;
}

export interface ScanResult {
  success: boolean;
  message: string;
  ticket?: Ticket;
  guestName?: string;
}
