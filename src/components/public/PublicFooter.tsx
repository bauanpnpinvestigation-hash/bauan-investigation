import React from 'react';
import { Shield, Phone, Mail, MapPin, Scale, HeartHandshake, ShieldCheck } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="relative z-30 bg-slate-950 text-slate-300 border-t border-blue-900/60 font-sans mt-auto">
      {/* Upper Footer: Professional, authoritative content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm leading-relaxed">
        
        {/* Column 1: Seal & Justice Pledge */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-900/40 rounded-xl border border-blue-700/50 text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-extrabold tracking-wider text-xs uppercase">
                Pledge of Integrity & Justice
              </h3>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                Katapatan at Katarungan
              </p>
            </div>
          </div>
          
          <p className="text-xs text-slate-300 leading-relaxed">
            The Bauan Municipal Police Station - Investigation & Records Section stands firm in upholding truth, implementing the law with absolute integrity, and guaranteeing equal protection to every citizen of Bauan, Batangas. 
          </p>
          
          <div className="p-3 bg-blue-950/80 border border-blue-900/60 rounded-xl space-y-1.5 shadow-inner">
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>RA 10173 (Data Privacy Act of 2012)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              All personal information submitted through this secure portal is handled with strict confidentiality and is protected by security-hardened Cloud Firestore encryption.
            </p>
          </div>
        </div>

        {/* Column 2: Hotlines & Telephone Numbers */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-900/40 rounded-xl border border-blue-700/50 text-amber-400">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-extrabold tracking-wider text-xs uppercase">
                Emergency & Hotlines
              </h3>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                Mga Numero ng Telepono
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Telephone Number */}
            <a 
              href="tel:0437271253" 
              className="group block p-3 bg-slate-900 hover:bg-slate-900/80 border border-slate-800 hover:border-blue-800 rounded-xl transition-all shadow-xs"
            >
              <div className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-blue-400 tracking-wider">
                Bauan MPS Telephone Number
              </div>
              <div className="text-sm font-black text-white group-hover:text-amber-400 transition-colors flex items-center justify-between mt-0.5">
                <span>(043) 727-1253</span>
                <span className="text-[11px] text-blue-400 group-hover:text-amber-400 font-semibold px-2 py-0.5 bg-blue-950 rounded border border-blue-900">
                  Call Line
                </span>
              </div>
            </a>

            {/* Mobile Hotlines */}
            <a 
              href="tel:+639985985664" 
              className="group block p-3 bg-slate-900 hover:bg-slate-900/80 border border-slate-800 hover:border-blue-800 rounded-xl transition-all shadow-xs"
            >
              <div className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-blue-400 tracking-wider">
                PNP Mobile Hotline (Smart)
              </div>
              <div className="text-sm font-black text-white group-hover:text-amber-400 transition-colors flex items-center justify-between mt-0.5">
                <span>+63 998 598 5664</span>
                <span className="text-[11px] text-blue-400 group-hover:text-amber-400 font-semibold px-2 py-0.5 bg-blue-950 rounded border border-blue-900">
                  Call/SMS
                </span>
              </div>
            </a>

            {/* National Emergency */}
            <div className="flex items-center justify-between p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-300 font-bold uppercase tracking-wider">National Emergency Hotline</span>
              </div>
              <span className="text-sm font-black text-red-400 font-mono">911</span>
            </div>
          </div>
        </div>

      </div>

      {/* PNP Core Motto Marquee/Strip */}
      <div className="bg-slate-900/70 border-y border-slate-900 py-3 text-center overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-400 tracking-wide">
          <div className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span>Maka-Diyos</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <HeartHandshake className="w-3.5 h-3.5 text-amber-500" />
            <span>Makatao</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Makakalikasan</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Scale className="w-3.5 h-3.5 text-red-500" />
            <span>Makabansa</span>
          </div>
        </div>
      </div>

      {/* Bottom Copyright and Metadata Info */}
      <div className="bg-slate-950 py-5 text-center text-[11px] text-slate-500 border-t border-slate-900">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} Bauan Municipal Police Station. All Rights Reserved.
          </span>
          <span className="text-slate-400 font-mono tracking-wider">
            To Serve & Protect • Batangas PNP
          </span>
        </div>
      </div>
    </footer>
  );
};
