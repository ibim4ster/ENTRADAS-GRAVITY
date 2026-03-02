import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, Event } from '../types';
import { api } from '../services/api';
import { format } from 'date-fns';
import { CheckCircle2, Ticket as TicketIcon, Calendar, MapPin, ArrowLeft, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const TicketView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isNewPurchase = location.state?.success;
  const purchaseCount = location.state?.count || 1;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!id) return;
      const t = await api.getTicket(id);
      if (t) {
        setTicket(t);
        const e = await api.getEvent(t.eventId);
        if (e) setEvent(e);
      }
      setLoading(false);
    };
    fetchTicket();
  }, [id]);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('ticket-container');
    if (!element || !ticket) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        backgroundColor: '#000000',
        onclone: (clonedDoc) => {
          // Fix for html2canvas not supporting modern color spaces like oklab/oklch
          const ticketEl = clonedDoc.getElementById('ticket-container');
          if (ticketEl) {
            // Force standard colors on the ticket itself
            ticketEl.style.backgroundColor = '#ffffff';
            ticketEl.style.color = '#000000';
            
            // Aggressively replace oklab/oklch colors in all elements
            const allElements = ticketEl.querySelectorAll('*');
            allElements.forEach((el) => {
              const htmlEl = el as HTMLElement;
              const style = window.getComputedStyle(htmlEl);
              
              // Helper to check if a color string contains unsupported functions
              const isUnsupported = (color: string) => color.includes('oklab') || color.includes('oklch');
              
              if (isUnsupported(style.color)) {
                // Fallback to black or a specific color if we can't parse it
                htmlEl.style.color = htmlEl.classList.contains('text-indigo-600') ? '#4f46e5' : '#000000';
              }
              
              if (isUnsupported(style.backgroundColor)) {
                htmlEl.style.backgroundColor = htmlEl.classList.contains('bg-zinc-50') ? '#f8f8f8' : 'transparent';
              }

              if (isUnsupported(style.borderColor)) {
                htmlEl.style.borderColor = '#e5e7eb';
              }
            });

            // Specific fix for the perforation circles which use bg-zinc-950
            const circles = ticketEl.querySelectorAll('.bg-zinc-950');
            circles.forEach(c => (c as HTMLElement).style.backgroundColor = '#09090b');
          }
        }
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Gravity-Ticket-${ticket.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!ticket || !event) return <div className="text-center py-20 text-xl text-zinc-400">Ticket not found</div>;

  const isUsed = ticket.status === 'used';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      {isNewPurchase && (
        <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400">
          <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
          <div>
            <h3 className="font-bold">Purchase Successful!</h3>
            <p className="text-sm opacity-80">
              {purchaseCount > 1 
                ? `You've purchased ${purchaseCount} tickets. They are all available in your wallet.` 
                : `We've sent a copy to ${ticket.guestEmail}`}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <Link to="/wallet" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Wallet
        </Link>
        <div className="flex gap-4">
          <button 
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {isDownloading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download PDF
          </button>
        </div>
      </div>

      <div id="ticket-container" className="relative bg-white text-black rounded-[2rem] overflow-hidden shadow-2xl">
        {/* Ticket Header Image */}
        <div className="h-48 relative">
          <img 
            src={event.imageUrl} 
            alt={event.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <h1 className="text-3xl font-bold tracking-tight mb-1">{event.title}</h1>
            <p className="text-white/80 font-medium">{event.location}</p>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative">
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <TicketIcon className="w-64 h-64" />
          </div>

          <div className="space-y-6 z-10">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-1">Guest</p>
              <p className="text-xl font-bold">{ticket.guestName}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-1">Date</p>
                <p className="font-bold">{format(new Date(event.date), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-1">Time</p>
                <p className="font-bold">{format(new Date(event.date), 'h:mm a')}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-1">Ticket Type</p>
              <p className="font-bold text-indigo-600">{event.tiers.find(t => t.id === ticket.tierId)?.name}</p>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center justify-center p-6 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200 z-10 relative">
            {isUsed && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-3xl z-20">
                <div className="bg-red-500 text-white px-6 py-2 rounded-full font-bold text-xl rotate-[-15deg] shadow-lg border-4 border-white">
                  USED
                </div>
              </div>
            )}
            <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
              <QRCodeSVG 
                value={ticket.signature} 
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-zinc-400 font-mono text-center break-all w-full">
              {ticket.id}
            </p>
          </div>
        </div>

        {/* Perforation Line */}
        <div className="absolute left-0 right-0 top-48 flex items-center justify-between -mt-3">
          <div className="w-6 h-6 rounded-full bg-zinc-950 -ml-3" />
          <div className="h-0 border-t-2 border-dashed border-zinc-300 w-full mx-2" />
          <div className="w-6 h-6 rounded-full bg-zinc-950 -mr-3" />
        </div>
      </div>
    </motion.div>
  );
};
