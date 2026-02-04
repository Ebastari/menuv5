
import React, { useState, useEffect } from 'react';
import { UserProfile, WeatherCondition } from '../types';

const LOGO_URL = "https://i.ibb.co.com/29Gzw6k/montana-AI.jpg";

interface TopNavbarProps {
  user: UserProfile;
  isAuthenticated: boolean;
  currentTime: string;
  weatherCondition: WeatherCondition;
  temp: number;
  humidity: number;
  precipitation: number;
  windspeed: number;
  windDirection: string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onProfileClick: () => void;
}

interface NavBoxProps {
  children: React.ReactNode;
  className?: string;
}

const NavBox: React.FC<NavBoxProps> = ({ children, className = "" }) => (
  <div className={`bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[24px] p-2 sm:p-3 shadow-sm flex items-center gap-2 sm:gap-3 transition-all hover:bg-white/60 dark:hover:bg-slate-900/60 ${className}`}>
    {children}
  </div>
);

export const TopNavbar: React.FC<TopNavbarProps> = ({
  user,
  isAuthenticated,
  currentTime,
  weatherCondition,
  temp,
  humidity,
  precipitation,
  windspeed,
  windDirection,
  isDarkMode,
  toggleDarkMode,
  onProfileClick
}) => {
  const [coords, setCoords] = useState<{ lat: string; lon: string }>({ lat: "...", lon: "..." });
  const [satellites, setSatellites] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [gpsStatus, setGpsStatus] = useState<'searching' | 'locked' | 'error'>('searching');

  const startGpsWatch = () => {
    if (navigator.geolocation) {
      setGpsStatus('searching');
      return navigator.geolocation.watchPosition((pos) => {
        const acc = pos.coords.accuracy;
        setAccuracy(acc);
        setCoords({
          lat: pos.coords.latitude.toFixed(6),
          lon: pos.coords.longitude.toFixed(6)
        });
        
        setGpsStatus('locked');
        
        const getSimSats = (a: number) => {
          if (a < 10) return 24;
          if (a < 30) return 18;
          if (a < 60) return 12;
          return 4;
        };
        
        setSatellites(getSimSats(acc) + Math.floor(Math.random() * 3));

      }, (err) => {
        console.warn("GPS Error:", err);
        setGpsStatus('error');
        setSatellites(0);
      }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
    }
    return null;
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const watchId = startGpsWatch();

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getWeatherLabel = (condition: WeatherCondition) => {
    switch (condition) {
      case 'clear': return 'CERAH';
      case 'rain': return 'HUJAN';
      case 'cloudy': return 'BERAWAN';
      case 'storm': return 'BADAI';
      default: return 'SCANNING';
    }
  };

  const getSignalStrength = () => {
    if (!accuracy) return 0;
    if (accuracy < 15) return 4;
    if (accuracy < 35) return 3;
    if (accuracy < 60) return 2;
    return 1;
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-[100] bg-white/70 dark:bg-slate-950/70 backdrop-blur-3xl border-b border-white/20 dark:border-slate-900/50 py-3 sm:py-4 px-3 sm:px-8">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-3 sm:gap-4">
        
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div 
            className="flex items-center gap-2 sm:gap-4 pl-2 pr-3 sm:pr-5 py-2 rounded-[22px] bg-slate-900 dark:bg-emerald-600 text-white cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg ring-1 ring-white/10"
            onClick={onProfileClick}
          >
            <div className="relative group shrink-0">
              <img 
                src={isAuthenticated ? user.photo : LOGO_URL} 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-[12px] sm:rounded-[14px] object-cover border-2 border-white/20 bg-white shadow-md"
                alt="Profile"
              />
              <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${isAuthenticated ? 'bg-emerald-400' : 'bg-slate-400'} shadow-sm`}></div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-tight leading-none mb-1 truncate">
                {isAuthenticated ? user.name : 'MONTANA ACCESS'}
              </span>
              <span className="text-[6.5px] sm:text-[7.5px] font-black opacity-60 uppercase tracking-[0.2em] mt-0.5 truncate">
                {isAuthenticated ? user.jabatan : 'SECURE IDENTITY'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[22px] p-1.5 px-3 sm:px-4 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
             <div className="flex flex-col items-end mr-1 sm:mr-2">
                <span className="text-[12px] sm:text-[14px] font-black text-slate-900 dark:text-white tabular-nums tracking-tighter leading-none">
                  {currentTime}
                </span>
                <span className="text-[6px] sm:text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1">WITA</span>
             </div>
             <button onClick={toggleDarkMode} className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-slate-100/80 dark:bg-slate-800/80 flex items-center justify-center text-slate-500 dark:text-slate-400 active:scale-90 transition-all border border-black/5 dark:border-white/5">
                <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-[9px] sm:text-[10px]`}></i>
             </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <NavBox className="justify-start overflow-hidden relative group">
            <div className="flex items-center gap-2 sm:gap-4 relative z-10 w-full overflow-hidden">
              <div className="flex flex-col items-center shrink-0">
                <div className="flex items-end gap-[1px] h-2.5 sm:h-3.5 mb-1">
                  {[1,2,3,4].map(bar => (
                    <div 
                      key={bar} 
                      className={`w-0.5 sm:w-1.5 rounded-t-[1px] transition-all duration-700 ${bar <= getSignalStrength() ? (gpsStatus === 'locked' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400 animate-pulse') : 'bg-slate-200 dark:bg-slate-800'}`}
                      style={{ height: `${bar * 25}%` }}
                    />
                  ))}
                </div>
                <span className={`text-[5.5px] sm:text-[6.5px] font-black uppercase tracking-widest ${gpsStatus === 'locked' ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {gpsStatus}
                </span>
              </div>
              
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                  <span className="text-[7.5px] sm:text-[10px] font-black text-slate-900 dark:text-white font-mono tracking-tighter bg-black/5 dark:bg-white/5 px-1 py-0.5 rounded-md truncate">LAT: {coords.lat}</span>
                  <span className="text-[7.5px] sm:text-[10px] font-black text-slate-900 dark:text-white font-mono tracking-tighter bg-black/5 dark:bg-white/5 px-1 py-0.5 rounded-md truncate">LON: {coords.lon}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                   <span className={`text-[6px] sm:text-[7.5px] font-black uppercase tracking-widest flex items-center gap-1 ${accuracy && accuracy < 50 ? 'text-emerald-500' : 'text-slate-400'}`}>
                     <i className="fas fa-crosshairs text-[6px] sm:text-[8px]"></i> {accuracy ? `±${accuracy.toFixed(0)}m` : 'SIGNAL'}
                   </span>
                </div>
              </div>
            </div>
          </NavBox>

          <NavBox className="justify-between group overflow-hidden">
            <div className="flex items-center gap-2 sm:gap-4 w-full overflow-hidden">
              <div className="w-8 h-8 sm:w-12 sm:h-12 shrink-0 rounded-[12px] sm:rounded-[18px] bg-white dark:bg-slate-800 flex items-center justify-center text-sm sm:text-2xl text-emerald-600 dark:text-emerald-400 border border-black/5 dark:border-white/5 shadow-sm">
                <i className={`fas ${weatherCondition === 'clear' ? 'fa-sun' : weatherCondition === 'rain' ? 'fa-cloud-showers-heavy' : weatherCondition === 'storm' ? 'fa-bolt' : 'fa-cloud'}`}></i>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1 sm:gap-2.5">
                  <span className="text-[11px] sm:text-[14px] font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{temp}°</span>
                  <span className="text-[6px] sm:text-[8px] font-black px-1 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md sm:rounded-lg uppercase tracking-widest border border-emerald-500/20 truncate">
                    {getWeatherLabel(weatherCondition)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-3 mt-0.5 sm:mt-2 text-[6px] sm:text-[7.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest overflow-hidden">
                  <span className="flex items-center gap-0.5 shrink-0"><i className="fas fa-tint text-blue-400"></i> {humidity}%</span>
                  <span className="flex items-center gap-0.5 shrink-0"><i className="fas fa-cloud-rain"></i> {precipitation.toFixed(0)}m</span>
                </div>
              </div>
            </div>
          </NavBox>
        </div>

      </div>
    </header>
  );
};
