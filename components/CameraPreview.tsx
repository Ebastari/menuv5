
import React, { useState, useRef } from 'react';

export const CameraPreview: React.FC = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      const errorMsg = "Akses kamera ditolak. Montana AI memerlukan izin kamera untuk fitur dokumentasi lapangan dan verifikasi biometrik.";
      setError(errorMsg);
      alert(errorMsg);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[44px] p-8 border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden group transition-all animate-fadeIn">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-[22px] bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-xl shadow-emerald-500/20">
            <i className="fas fa-camera-viewfinder"></i>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-1">Live Feed Preview</h3>
            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em]">Montana Intelligent Vision</p>
          </div>
        </div>
        {!stream ? (
          <button 
            onClick={startCamera}
            className="w-full md:w-auto px-10 py-4 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <i className="fas fa-video"></i>
            Akses Kamera
          </button>
        ) : (
          <button 
            onClick={stopCamera}
            className="w-full md:w-auto px-10 py-4 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <i className="fas fa-video-slash"></i>
            Hentikan Feed
          </button>
        )}
      </div>

      {stream ? (
        <div className="relative rounded-[36px] overflow-hidden aspect-video bg-black shadow-2xl ring-1 ring-white/10 group-hover:ring-emerald-500/30 transition-all duration-700 animate-drift-puff">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          
          {/* Scanning Overlay Effect */}
          <div className="absolute inset-0 pointer-events-none">
             <div className="absolute inset-0 bg-emerald-500/5"></div>
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-[scan_3s_infinite]"></div>
          </div>

          <div className="absolute top-6 left-6 flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] font-black text-white uppercase tracking-widest">Live Stream Active</span>
          </div>

          <div className="absolute bottom-6 right-6 flex items-center gap-4">
             <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg text-[8px] font-mono text-white/70">
                REC: {new Date().toLocaleTimeString()}
             </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-[36px] overflow-hidden aspect-video bg-slate-100 dark:bg-slate-950/50 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 transition-all group-hover:border-emerald-500/30">
           <i className="fas fa-video-slash text-4xl text-slate-300 dark:text-slate-800 mb-4"></i>
           <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Kamera tidak aktif</p>
        </div>
      )}

      {error && !stream && (
        <div className="mt-6 p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl animate-shake">
          <p className="text-[10px] font-bold text-rose-500 uppercase leading-relaxed text-center tracking-wide">
            <i className="fas fa-circle-exclamation mr-2"></i> {error}
          </p>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
