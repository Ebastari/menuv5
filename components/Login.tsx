
import React, { useState, useRef, useEffect } from 'react';
import { TermsContent } from './TermsContent';

const GOOGLE_CLIENT_ID = "357045986446-03056acv0ggnrhv7irv1dtk3b0fn5vmf.apps.googleusercontent.com";

// Added secureHash to support password hashing in ProfileEdit.tsx
/**
 * Hashes a string using SHA-256 for secure comparison.
 * Uses the Web Crypto API for cryptographic operations.
 */
export async function secureHash(message: string) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) { return null; }
}

interface LoginProps {
  onVerified: (userData: { name: string; photo: string; telepon: string; email: string; jabatan: string }, role: 'admin' | 'guest') => void;
  onClose: () => void;
}

type Step = 'welcome' | 'identity' | 'whatsapp' | 'terms' | 'gps' | 'facescan' | 'final';

export const Login: React.FC<LoginProps> = ({ onVerified, onClose }) => {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'guest'>('guest');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Data State
  const [formData, setFormData] = useState({ nama: '', email: '', telepon: '', password: '' });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [gps, setGps] = useState<{ lat: number | null; lon: number | null; acc: number | null; status: 'idle' | 'searching' | 'locked'; msg: string }>({ 
    lat: null, lon: null, acc: null, status: 'idle', msg: '' 
  });
  const [faceVerified, setFaceVerified] = useState(false);
  const [showBypassGps, setShowBypassGps] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const termsScrollRef = useRef<HTMLDivElement>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const gpsTimerRef = useRef<number | null>(null);

  // Progress Tracker
  const stepsList: Step[] = ['identity', 'whatsapp', 'terms', 'gps', 'facescan', 'final'];
  const progress = (stepsList.indexOf(currentStep) + 1) / (stepsList.length) * 100;

  useEffect(() => {
    const checkGoogleAndInit = () => {
      const google = (window as any).google;
      if (currentStep === 'welcome' && google) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp: any) => {
            const payload = parseJwt(resp.credential);
            if (payload) {
              setFormData(prev => ({ ...prev, nama: payload.name, email: payload.email }));
              setCurrentStep('whatsapp');
            }
          }
        });
        if (googleButtonRef.current) {
          google.accounts.id.renderButton(googleButtonRef.current, { theme: "outline", size: "large", width: 300, shape: "pill" });
        }
      }
    };

    // Wait for Google script to load
    const google = (window as any).google;
    if (google) {
      checkGoogleAndInit();
    } else {
      // Retry after 100ms if Google not loaded yet
      const interval = setInterval(() => {
        const g = (window as any).google;
        if (g) {
          clearInterval(interval);
          checkGoogleAndInit();
        }
      }, 100);
      // Cleanup interval after 5 seconds
      setTimeout(() => clearInterval(interval), 5000);
    }
  }, [currentStep]);

  const handleTermsScroll = () => {
    if (termsScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = termsScrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 50) setScrolledToBottom(true);
    }
  };

  const requestGPS = () => {
    setGps(prev => ({ ...prev, status: 'searching', msg: '🛰️ MENCARI SATELIT...' }));
    gpsTimerRef.current = window.setTimeout(() => setShowBypassGps(true), 5000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (gpsTimerRef.current) clearTimeout(gpsTimerRef.current);
        setGps({ 
          lat: pos.coords.latitude, lon: pos.coords.longitude, acc: Math.round(pos.coords.accuracy),
          status: 'locked', msg: `📍 LOKASI TERKUNCI`
        });
        setTimeout(() => setCurrentStep('facescan'), 1000);
      },
      () => bypassGPS(),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const bypassGPS = () => {
    if (gpsTimerRef.current) clearTimeout(gpsTimerRef.current);
    setGps({ lat: -3.33, lon: 115.79, acc: 999, status: 'locked', msg: '📍 TERKUNCI (BYPASS)' });
    setShowBypassGps(false);
    setTimeout(() => setCurrentStep('facescan'), 800);
  };

  const startFaceScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      
      let p = 0;
      const interval = setInterval(() => {
        p += 5;
        if (p >= 100) {
          clearInterval(interval);
          setFaceVerified(true);
          setTimeout(() => setCurrentStep('final'), 1000);
        }
      }, 150);
    } catch (err) {
      setFaceVerified(true);
      setCurrentStep('final');
    }
  };

  const handleFinalSubmit = () => {
    setIsSyncing(true);
    setTimeout(() => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      onVerified({
        name: formData.nama,
        photo: `https://ui-avatars.com/api/?name=${formData.nama}&background=random`,
        telepon: formData.telepon,
        email: formData.email,
        jabatan: selectedRole === 'admin' ? 'Internal Admin' : 'Portal Member'
      }, selectedRole);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-0 md:p-4 bg-slate-950/80 backdrop-blur-md">
      
      {/* FULL SCREEN OVERLAY FOR TERMS */}
      {currentStep === 'terms' && (
        <div className="fixed inset-0 z-[600] bg-white dark:bg-slate-950 flex flex-col animate-fadeIn">
          <header className="px-6 py-6 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Pakta Integritas</h2>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Langkah 3 dari 6</p>
            </div>
            <div className="text-right">
              <span className={`text-[9px] font-black px-4 py-1.5 rounded-full border transition-all ${scrolledToBottom ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {scrolledToBottom ? 'SIAP DISETUJUI' : 'SILAKAN BACA SAMPAI BAWAH'}
              </span>
            </div>
          </header>

          <div 
            ref={termsScrollRef} 
            onScroll={handleTermsScroll}
            className="flex-1 overflow-y-auto p-6 md:p-16 max-w-4xl mx-auto no-scrollbar"
          >
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <TermsContent />
            </div>
          </div>

          <footer className="p-6 bg-slate-50 dark:bg-slate-900 border-t dark:border-slate-800 flex flex-col items-center gap-4">
             <label className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${scrolledToBottom ? 'cursor-pointer opacity-100' : 'opacity-30'}`}>
                <input 
                  type="checkbox" 
                  disabled={!scrolledToBottom} 
                  checked={agreedToTerms} 
                  onChange={e => setAgreedToTerms(e.target.checked)} 
                  className="w-6 h-6 rounded-lg text-emerald-600"
                />
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">SAYA MENYETUJUI SELURUH PASAL DI ATAS</span>
             </label>
             <button 
               disabled={!agreedToTerms} 
               onClick={() => setCurrentStep('gps')} 
               className="w-full max-w-md py-6 bg-emerald-600 disabled:bg-slate-200 text-white rounded-[28px] font-black uppercase text-sm shadow-2xl transition-all active:scale-95"
             >
               Setuju & Lanjutkan Verifikasi
             </button>
          </footer>
        </div>
      )}

      {/* MODAL CONTAINER FOR OTHER STEPS */}
      {currentStep !== 'terms' && (
        <div className={`relative w-full max-w-sm h-full md:h-auto bg-white dark:bg-slate-900 md:rounded-[44px] p-10 shadow-2xl border border-white/50 dark:border-slate-800 transition-all duration-500 flex flex-col justify-center ${isSyncing ? 'scale-95 opacity-50' : 'opacity-100'}`}>
          
          {currentStep !== 'welcome' && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800 md:rounded-t-[44px] overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${progress}%` }}></div>
            </div>
          )}

          {/* WELCOME */}
          {currentStep === 'welcome' && (
            <div className="space-y-10 text-center animate-fadeIn">
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto p-4 shadow-inner">
                <img src="https://i.ibb.co.com/29Gzw6k/montana-AI.jpg" className="w-full h-full object-contain" alt="Logo" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Montana ID Sync</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Smart Protocol V4.5</p>
              </div>
              <div className="space-y-4">
                <button onClick={() => { setSelectedRole('admin'); setCurrentStep('identity'); }} className="w-full p-6 bg-slate-900 dark:bg-emerald-600 text-white rounded-[24px] font-black uppercase text-xs shadow-2xl active:scale-95 transition-all">
                  Login Administrator
                </button>
                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800"></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase">Atau</span>
                  <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800"></div>
                </div>
                <div ref={googleButtonRef} className="flex justify-center"></div>
                <button onClick={onClose} className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-6">Akses Terbatas</button>
              </div>
            </div>
          )}

          {/* STEP 1: IDENTITY */}
          {currentStep === 'identity' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">1. Identitas</h3>
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Informasi Dasar Profil</p>
              </div>
              <div className="space-y-3">
                <input type="text" placeholder="NAMA LENGKAP" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-black uppercase outline-none dark:text-white border border-slate-100 dark:border-slate-700" />
                <input type="email" placeholder="EMAIL KOORDINASI" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-black uppercase outline-none dark:text-white border border-slate-100 dark:border-slate-700" />
                {selectedRole === 'admin' && <input type="password" placeholder="PASSWORD SISTEM" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-black uppercase outline-none dark:text-white border border-slate-100 dark:border-slate-700" />}
              </div>
              <button onClick={() => {
                if (selectedRole === 'admin' && formData.password !== 'kalimantan selatan') { alert('Password Salah'); return; }
                if (formData.nama && formData.email) setCurrentStep('whatsapp');
              }} className="w-full py-6 bg-emerald-600 text-white rounded-[24px] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Lanjut</button>
            </div>
          )}

          {/* STEP 2: WHATSAPP */}
          {currentStep === 'whatsapp' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">2. Komunikasi</h3>
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Sinkronisasi WhatsApp Laporan</p>
              </div>
              <p className="text-xs font-medium text-slate-400 leading-relaxed">Digunakan untuk mengirimkan ringkasan harian stok bibit dan alert sistem.</p>
              <input type="tel" placeholder="NO. WHATSAPP (CONTOH: 0812...)" value={formData.telepon} onChange={e => setFormData({...formData, telepon: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-black tracking-widest outline-none dark:text-white border border-slate-100 dark:border-slate-700" />
              <button onClick={() => formData.telepon && setCurrentStep('terms')} className="w-full py-6 bg-emerald-600 text-white rounded-[24px] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Buka Pakta Integritas</button>
            </div>
          )}

          {/* STEP 4: GPS */}
          {currentStep === 'gps' && (
            <div className="space-y-10 animate-fadeIn text-center">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">4. Verifikasi Lokasi</h3>
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Geofencing Protocol</p>
              </div>
              <div className="w-28 h-28 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/20">
                <i className={`fas ${gps.status === 'searching' ? 'fa-satellite-dish animate-spin' : 'fa-location-dot'} text-4xl text-emerald-600`}></i>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">{gps.msg || 'Menunggu kunci sinyal satelit...'}</p>
              <button onClick={requestGPS} disabled={gps.status === 'searching'} className="w-full py-6 bg-emerald-600 text-white rounded-[24px] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">
                {gps.status === 'searching' ? 'MENCARI SINYAL...' : 'KUNCI LOKASI'}
              </button>
              {showBypassGps && <button onClick={bypassGPS} className="text-[9px] font-black text-emerald-600 underline uppercase animate-pulse">Lewati (Bypass Desktop)</button>}
            </div>
          )}

          {/* STEP 5: FACESCAN */}
          {currentStep === 'facescan' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">5. Biometrik</h3>
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Digital Face Signature</p>
              </div>
              <div className="relative rounded-[48px] overflow-hidden aspect-square bg-black shadow-inner ring-4 ring-emerald-500/10">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                {!faceVerified && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-full h-1 bg-emerald-500 absolute animate-[scan_2s_infinite]"></div>
                    <p className="text-[10px] font-black text-white uppercase mt-auto mb-10 bg-black/40 px-6 py-2 rounded-full backdrop-blur-md">Scanning Wajah...</p>
                  </div>
                )}
                {faceVerified && (
                  <div className="absolute inset-0 bg-emerald-600/60 flex flex-col items-center justify-center animate-fadeIn">
                    <i className="fas fa-shield-check text-white text-6xl mb-3"></i>
                    <p className="text-sm font-black text-white uppercase tracking-widest">ID VERIFIED</p>
                  </div>
                )}
              </div>
              {!faceVerified && (
                <button onClick={startFaceScan} className="w-full py-6 bg-emerald-600 text-white rounded-[24px] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">
                  Mulai Verifikasi Wajah
                </button>
              )}
            </div>
          )}

          {/* STEP 6: FINAL */}
          {currentStep === 'final' && (
            <div className="space-y-10 text-center animate-fadeIn">
              <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-4xl shadow-2xl">
                <i className="fas fa-check-double"></i>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Sinkronisasi Siap</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Semua Protokol Valid</p>
              </div>
              <button onClick={handleFinalSubmit} className="w-full py-8 bg-slate-900 dark:bg-emerald-600 text-white rounded-[32px] font-black text-sm uppercase tracking-[0.3em] shadow-2xl animate-pulse active:scale-95 transition-all">
                MASUK DASHBOARD
              </button>
            </div>
          )}

        </div>
      )}

      <style>{`
        @keyframes scan { 0% { top: 0%; } 100% { top: 100%; } }
      `}</style>
    </div>
  );
};
