import React, { useEffect, useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ScanResult } from '../types';
import { CheckCircle2, XCircle, ScanLine, User, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { clsx } from 'clsx';

export const Scanner: React.FC = () => {
  const { user } = useAuth();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [assignedEvents, setAssignedEvents] = useState<Event[]>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (user?.role === 'staff' || user?.role === 'admin') {
      api.getEvents().then(allEvents => {
        if (user.role === 'admin') {
          setAssignedEvents(allEvents);
        } else {
          const filtered = allEvents.filter(e => user.assignedEventIds?.includes(e.id));
          setAssignedEvents(filtered);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) return;

    if (isScanning && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
        },
        false
      );

      scannerRef.current.render(
        async (decodedText) => {
          if (!isScanning) return;
          setIsScanning(false);
          if (scannerRef.current) {
            scannerRef.current.pause();
          }

          try {
            const result = await api.scanTicket(decodedText, user.id);
            setScanResult(result);
            
            // Auto resume after 3 seconds
            setTimeout(() => {
              setScanResult(null);
              setIsScanning(true);
              if (scannerRef.current) {
                scannerRef.current.resume();
              }
            }, 3000);
          } catch (error) {
            console.error("Scan error", error);
            setIsScanning(true);
            if (scannerRef.current) {
              scannerRef.current.resume();
            }
          }
        },
        (error) => {
          // Ignore continuous scan errors
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [user, isScanning]);

  if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="p-6 bg-zinc-900/50 backdrop-blur-xl border-b border-white/10 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
            <ScanLine className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Access Control</h1>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Scanner Active</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">{user.name}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{user.role}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left: Scanner */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-8 lg:border-r border-white/5">
          <div className="w-full max-w-md space-y-8">
            <div 
              id="reader" 
              className={clsx(
                "w-full aspect-square rounded-[3rem] overflow-hidden border-8 transition-all duration-500 shadow-2xl",
                !scanResult ? "border-white/5 bg-zinc-900/50" :
                scanResult.success ? "border-emerald-500 shadow-emerald-500/20" : "border-red-500 shadow-red-500/20"
              )}
            ></div>

            <div className="text-center space-y-2">
              <p className="text-zinc-500 text-sm font-medium">Position the QR code within the frame</p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Ready to scan</span>
              </div>
            </div>
          </div>

          {/* Overlay Result */}
          <AnimatePresence>
            {scanResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="absolute inset-x-8 bottom-12 max-w-md mx-auto z-20"
              >
                <div className={clsx(
                  "p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl border-2",
                  scanResult.success 
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-50" 
                    : "bg-red-500/20 border-red-500/50 text-red-50"
                )}>
                  <div className="flex items-start gap-6">
                    <div className={clsx(
                      "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0",
                      scanResult.success ? "bg-emerald-500/20" : "bg-red-500/20"
                    )}>
                      {scanResult.success ? (
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                      ) : (
                        <XCircle className="w-10 h-10 text-red-400" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold tracking-tight mb-2">
                        {scanResult.success ? 'Access Granted' : 'Access Denied'}
                      </h2>
                      <p className="text-lg opacity-80 mb-6 leading-tight">{scanResult.message}</p>
                      
                      {scanResult.guestName && (
                        <div className="bg-black/40 rounded-2xl p-4 flex items-center gap-4 border border-white/5">
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest font-bold opacity-50">Guest Name</p>
                            <p className="font-bold text-xl">{scanResult.guestName}</p>
                          </div>
                        </div>
                      )}
                      
                      {scanResult.ticket?.scannedAt && !scanResult.success && (
                        <div className="mt-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest opacity-60">
                          <Clock className="w-4 h-4" />
                          Last Scan: {format(new Date(scanResult.ticket.scannedAt), 'h:mm:ss a')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Assigned Events */}
        <div className="w-full lg:w-96 bg-zinc-900/30 p-8 border-t lg:border-t-0 lg:border-l border-white/5 overflow-y-auto">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 mb-8">Assigned Events</h2>
          
          <div className="space-y-4">
            {assignedEvents.length > 0 ? (
              assignedEvents.map(event => (
                <div key={event.id} className="bg-zinc-900/50 border border-white/5 rounded-3xl p-5 flex items-center gap-4 group hover:border-indigo-500/30 transition-all">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0">
                    <img src={event.imageUrl} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm truncate">{event.title}</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                      {format(new Date(event.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 px-6 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                <AlertCircle className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 text-sm font-medium">No events assigned to you yet.</p>
              </div>
            )}
          </div>

          <div className="mt-12 p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl">
            <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">Staff Protocol</h4>
            <ul className="space-y-3 text-[11px] text-zinc-400 font-medium">
              <li className="flex gap-2">
                <span className="text-indigo-500">•</span>
                Verify guest ID matches ticket name
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-500">•</span>
                Check for duplicate scan warnings
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-500">•</span>
                Contact supervisor for invalid codes
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
