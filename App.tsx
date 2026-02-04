
import React, { useState, useEffect, useMemo } from 'react';
import { GrowthCard } from './components/GrowthCard';
import { MenuGrid } from './components/MenuGrid';
import { BottomNav } from './components/BottomNav';
import { WeatherOverlay } from './components/WeatherOverlay';
import { Login } from './components/Login';
import { ProfileEdit } from './components/ProfileEdit';
import { AboutSection } from './components/AboutSection';
import { DashboardBibitAI } from './components/DashboardBibitAI';
import { RosterWidget } from './components/RosterWidget';
import { SeedlingSummary } from './components/SeedlingSummary';
import { HelpCenter } from './components/HelpCenter';
import { LayananPengaduan } from './components/LayananPengaduan';
import { FloatingStockBubble } from './components/FloatingStockBubble';
import { TopNavbar } from './components/TopNavbar';
import { PartnerSection } from './components/PartnerSection';
import { GamePromotionSection } from './components/GamePromotionSection';
import { PlayStoreSection } from './components/PlayStoreSection';
import { DeveloperInfo } from './components/DeveloperInfo';
import { BibitNotificationToast } from './components/BibitNotificationToast';
import { UserProfileView } from './components/UserProfileView';
import { SubscribeWidget } from './components/SubscribeWidget';
import { GlobalFooter } from './components/GlobalFooter';
import { MontanaProfile } from './components/MontanaProfile';
import { Forecast7Days } from './components/Forecast7Days';
import { SystemHistory } from './components/SystemHistory';
import { WelcomeLoginPrompt } from './components/WelcomeLoginPrompt';
import { CameraPreview } from './components/CameraPreview';
import { UserProfile, WeatherCondition } from './types';

const LOGO_URL = "https://i.ibb.co.com/29Gzw6k/montana-AI.jpg";
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby09rbjwN2EcVRwhsNBx8AREI7k41LY1LrZ-W4U36HmzMB5BePD9h8wBSVPJwa_Ycduvw/exec?sheet=Bibit";
const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const AdminFeatureLock: React.FC<{ children: React.ReactNode; role: string; title?: string }> = ({ children, role, title = "Akses Terbatas" }) => {
  if (role === 'admin') return <>{children}</>;
  return (
    <div className="relative group overflow-hidden rounded-[44px]">
      <div className="absolute inset-0 z-20 bg-slate-50/60 dark:bg-slate-950/60 backdrop-blur-[12px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[44px]">
        <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-2xl mb-4 ring-8 ring-emerald-500/10">
          <i className="fas fa-lock text-emerald-600 dark:text-emerald-400 text-xl"></i>
        </div>
        <h3 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-2">{title}</h3>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center px-8">Hanya tersedia untuk Administrator.</p>
      </div>
      <div className="opacity-30 grayscale blur-[8px] pointer-events-none scale-[0.98]">
        {children}
      </div>
    </div>
  );
};

const GoogleVerificationWarning: React.FC<{ onAction: () => void }> = ({ onAction }) => (
  <div className="fixed bottom-28 left-4 right-4 z-[90] animate-drift-puff">
    <div className="bg-amber-500 dark:bg-amber-600 rounded-[28px] p-5 shadow-2xl border border-white/20 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
          <i className="fas fa-triangle-exclamation text-lg"></i>
        </div>
        <div className="flex flex-col">
          <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Verifikasi Google Diperlukan</p>
          <p className="text-[8px] font-bold text-white/80 uppercase tracking-tight">Tautkan akun Google untuk akses penuh.</p>
        </div>
      </div>
      <button 
        onClick={onAction}
        className="px-5 py-2.5 bg-white text-amber-600 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
      >
        Lengkapi
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const [isOAuthAuthenticated, setIsOAuthAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'guest' | 'none'>('none');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showDashboardAI, setShowDashboardAI] = useState(false);
  const [showDeveloperInfo, setShowDeveloperInfo] = useState(false);
  const [showMontanaProfile, setShowMontanaProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  const [weatherCondition, setWeatherCondition] = useState<WeatherCondition>('clear');
  const [weatherDetails, setWeatherDetails] = useState({ 
    temp: 0, windspeed: 0, humidity: 0, rain: 0, windDirection: 'N'
  });
  const [allBibitData, setAllBibitData] = useState<any[]>([]);
  const [latestUpdate, setLatestUpdate] = useState<any>(null);
  const [showDailyToast, setShowDailyToast] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('montana_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [user, setUser] = useState<UserProfile>({
    name: 'Tamu Montana', 
    photo: LOGO_URL,
    jabatan: 'Public Access', 
    telepon: '', 
    email: '', 
    activeSeconds: 0, 
    lastSeen: new Date().toISOString()
  });

  // Check persistence on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('montana_user_data');
    const savedRole = localStorage.getItem('montana_user_role');
    const savedOAuth = localStorage.getItem('montana_oauth_status');

    if (savedUser && savedRole) {
      try {
        setUser(JSON.parse(savedUser));
        setUserRole(savedRole as 'admin' | 'guest');
        setIsAuthenticated(true);
        if (savedOAuth === 'true') setIsOAuthAuthenticated(true);
      } catch (e) {
        localStorage.clear();
      }
    }
  }, []);

  const todaySummary = useMemo(() => {
    if (!allBibitData.length) return null;
    const todayStr = new Date().toLocaleDateString('id-ID'); 
    const todayEntries = allBibitData.filter(item => {
      const itemDate = new Date(item.tanggal).toLocaleDateString('id-ID');
      return itemDate === todayStr;
    });
    if (todayEntries.length === 0) return allBibitData[allBibitData.length - 1];
    return {
      bibit: todayEntries[todayEntries.length - 1].bibit,
      masuk: todayEntries.reduce((acc, curr) => acc + curr.masuk, 0),
      keluar: todayEntries.reduce((acc, curr) => acc + curr.keluar, 0),
      mati: todayEntries.reduce((acc, curr) => acc + curr.mati, 0),
      tanggal: todayEntries[todayEntries.length - 1].tanggal,
      isAggregated: true
    };
  }, [allBibitData]);

  const fetchWeather = async () => {
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=-3.33&longitude=115.79&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m`);
      const data = await response.json();
      if (data.current) {
        const cur = data.current;
        setWeatherDetails({
          temp: Math.round(cur.temperature_2m), 
          windspeed: Math.round(cur.wind_speed_10m),
          humidity: cur.relative_humidity_2m, 
          rain: cur.precipitation, 
          windDirection: DIRECTIONS[Math.round(cur.wind_direction_10m / 45) % 8]
        });
        const code = cur.weather_code;
        if ([0, 1].includes(code)) setWeatherCondition('clear');
        else if ([2, 3, 45, 48].includes(code)) setWeatherCondition('cloudy');
        else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) setWeatherCondition('rain');
        else if ([95, 96, 99].includes(code)) setWeatherCondition('storm');
        else setWeatherCondition('cloudy');
      }
    } catch (err) { 
      setWeatherCondition('cloudy');
    }
  };

  const fetchLatestNotif = async () => {
    try {
      const res = await fetch(SCRIPT_URL);
      const json = await res.json();
      let rows = Array.isArray(json) ? json : (json.Bibit || []);
      const normalized = rows.map((r: any) => ({
        tanggal: String(r.Tanggal || ''), 
        bibit: (r.Bibit || '').toString().trim(),
        masuk: parseInt(r.Masuk || 0), 
        keluar: parseInt(r.Keluar || 0),
        mati: parseInt(r.Mati || 0)
      }));
      setAllBibitData(normalized);
      if (normalized.length > 0) {
        setLatestUpdate(normalized[normalized.length - 1]);
        setShowDailyToast(true);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 300000); 
    const timer = setTimeout(() => setLoading(false), 800); 
    return () => {
      clearTimeout(timer);
      clearInterval(weatherInterval);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSeconds(prev => prev + 1);
      setCurrentTime(new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Makassar', hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('montana_dark_mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const handleLoginSuccess = (userData: any, role: 'admin' | 'guest') => {
    setUser(userData); 
    setUserRole(role); 
    setIsAuthenticated(true); 
    setShowLoginModal(false); 
    
    // Persistence
    localStorage.setItem('montana_user_data', JSON.stringify(userData));
    localStorage.setItem('montana_user_role', role);
    localStorage.setItem('montana_oauth_status', 'false');

    if (role === 'admin') fetchLatestNotif();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsOAuthAuthenticated(false);
    setUserRole('none');
    localStorage.removeItem('montana_user_data');
    localStorage.removeItem('montana_user_role');
    localStorage.removeItem('montana_oauth_status');
    setUser({
      name: 'Tamu Montana', photo: LOGO_URL, jabatan: 'Public Access', telepon: '', email: '', activeSeconds: 0, lastSeen: new Date().toISOString()
    });
    setActiveTab('home');
  };

  const handleOAuthSuccess = (data: { name: string; photo: string; email: string }) => {
    const updated = { ...user, ...data };
    setUser(updated);
    setIsOAuthAuthenticated(true);
    localStorage.setItem('montana_user_data', JSON.stringify(updated));
    localStorage.setItem('montana_oauth_status', 'true');
  };

  if (loading) return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center z-[1000]">
      <div className="w-24 h-24 relative mb-6">
        <img src={LOGO_URL} className="w-full h-full object-contain animate-float" alt="Loading" />
      </div>
      <h2 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-[0.5em]">Montana AI Pro</h2>
    </div>
  );

  return (
    <div className={`min-h-screen pb-48 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative`}>
      <WeatherOverlay condition={weatherCondition} />
      
      <TopNavbar 
          user={user} isAuthenticated={isAuthenticated} currentTime={currentTime} weatherCondition={weatherCondition}
          temp={weatherDetails.temp} humidity={weatherDetails.humidity} precipitation={weatherDetails.rain}
          windspeed={weatherDetails.windspeed} windDirection={weatherDetails.windDirection}
          isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onProfileClick={() => setActiveTab('profile')}
      />

      <main className="pt-64 px-4 space-y-16 max-w-[1440px] mx-auto relative z-10">
          {activeTab === 'home' && (
          <div className="space-y-16">
              {!isAuthenticated && <WelcomeLoginPrompt onRequestLogin={() => setShowLoginModal(true)} />}
              
              {isAuthenticated && !isOAuthAuthenticated && (
                <GoogleVerificationWarning onAction={() => setActiveTab('profile')} />
              )}

              <Forecast7Days />
              <AdminFeatureLock role={userRole} title="Visualisasi Lapangan"><CameraPreview /></AdminFeatureLock>
              <AdminFeatureLock role={userRole} title="Data Roster Admin"><RosterWidget /></AdminFeatureLock>
              <AdminFeatureLock role={userRole} title="Data Ringkasan Bibit"><SeedlingSummary /></AdminFeatureLock>
              <GrowthCard currentSeconds={activeSeconds} />
              <SubscribeWidget />
              <SystemHistory />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-16"><LayananPengaduan /><HelpCenter /></div>
                <div className="lg:col-span-4"><MenuGrid role={userRole} onOpenDashboardAI={() => setShowDashboardAI(true)} onRequestLogin={() => setShowLoginModal(true)} /></div>
              </div>
          </div>
          )}
          {activeTab === 'profile' && (
          <div className="space-y-12">
              <UserProfileView 
                user={user} 
                isOAuthAuthenticated={isOAuthAuthenticated} 
                onOAuthSuccess={handleOAuthSuccess} 
                onEdit={() => setShowProfileEdit(true)} 
                onLogout={handleLogout} 
              />
              <AboutSection onOpenMontanaProfile={() => setShowMontanaProfile(true)} onOpenDeveloper={() => setShowDeveloperInfo(true)} />
          </div>
          )}
      </main>
      
      <div className="mt-16 space-y-16 relative z-10">
          <GamePromotionSection /><PlayStoreSection /><PartnerSection /><GlobalFooter onOpenMontanaProfile={() => setShowMontanaProfile(true)} />
      </div>

      {userRole === 'admin' && <FloatingStockBubble data={todaySummary} />}
      {userRole === 'admin' && <BibitNotificationToast data={showDailyToast ? latestUpdate : null} onClose={() => setShowDailyToast(false)} />}
      
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} isAuthenticated={isAuthenticated} userRole={userRole} onRequestLogin={() => setShowLoginModal(true)} />

      {showLoginModal && <Login onVerified={handleLoginSuccess} onClose={() => setShowLoginModal(false)} />}
      {showProfileEdit && <ProfileEdit user={user} onSave={(updated) => { 
        const nextUser = {...user, ...updated};
        setUser(nextUser); 
        localStorage.setItem('montana_user_data', JSON.stringify(nextUser));
        setShowProfileEdit(false); 
      }} onClose={() => setShowProfileEdit(false)} />}
      {showDashboardAI && <DashboardBibitAI onClose={() => setShowDashboardAI(false)} />}
      {showDeveloperInfo && <DeveloperInfo onClose={() => setShowDeveloperInfo(false)} />}
      {showMontanaProfile && <MontanaProfile onClose={() => setShowMontanaProfile(false)} />}
    </div>
  );
};

export default App;
