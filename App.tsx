import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Layout, Cpu, Users, Settings, LogOut, Disc, LayoutDashboard, Shield, ShieldCheck, Loader2 } from 'lucide-react';
import { CoursePlayer } from './components/CoursePlayer';
import { AiImageEditor } from './components/AiImageEditor';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { AuthLogin } from './components/AuthLogin';
import { ViewState, Module, UserRole } from './types';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [modules, setModules] = useState<Module[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('FREE');
  const [loadingData, setLoadingData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 1. Check Auth Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
      if (session) fetchUserProfile(session.user.id, session.user.email);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id, session.user.email);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch User Profile
  const fetchUserProfile = async (userId: string, email?: string) => {
    // SUPER ADMIN OVERRIDE
    // Garante acesso administrativo para o dono do sistema
    if (email === 'andrepba20@gmail.com') {
        setUserRole('ADMIN');
        return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (data) {
        setUserRole(data.role as UserRole);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // 3. Fetch Modules & Lessons
  // showLoading: controls if the main spinner overlay appears
  const fetchData = async (showLoading = true) => {
    if (!session) return;
    
    if (showLoading) setLoadingData(true);
    setFetchError(null);
    
    try {
      // Fetch modules and join lessons
      const { data, error } = await supabase
        .from('modules')
        .select(`
          id,
          title,
          cover_image,
          is_premium,
          lessons (
            id,
            title,
            duration,
            is_premium,
            video_type,
            video_url,
            description,
            material_url,
            module_id
          )
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        // Map snake_case from DB to camelCase for app types
        const formattedModules: Module[] = data.map((m: any) => ({
          id: m.id,
          title: m.title,
          coverImage: m.cover_image,
          isPremium: m.is_premium || false, // Handle new column
          lessons: m.lessons.map((l: any) => ({
             id: l.id,
             title: l.title,
             duration: l.duration,
             isPremium: l.is_premium,
             videoType: l.video_type,
             videoUrl: l.video_url,
             description: l.description,
             materialUrl: l.material_url,
             locked: false 
          })).sort((a: any, b: any) => a.title.localeCompare(b.title))
        }));
        setModules(formattedModules);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setFetchError(error.message || "Falha desconhecida ao buscar dados.");
    } finally {
      if (showLoading) setLoadingData(false);
    }
  };

  useEffect(() => {
    if (session) {
        fetchData(true);
    }
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setModules([]);
    setUserRole('FREE');
    setCurrentView(ViewState.DASHBOARD);
  };

  if (loadingSession) {
    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <Loader2 className="text-bot-cyan animate-spin" size={48} />
        </div>
    );
  }

  if (!session) {
    return <AuthLogin />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-bank overflow-hidden flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-20 lg:w-72 bg-bot-panel border-r border-bot-purple/30 flex flex-col justify-between shrink-0 z-50">
        <div className="p-6">
          {/* Logo Area */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-16 h-16 relative flex-shrink-0 flex items-center justify-center">
               <div className="absolute inset-0 bg-bot-cyan blur-2xl opacity-20"></div>
               <img 
                  src="https://iili.io/fanwJff.png" 
                  alt="AutoBotz Logo" 
                  className="relative z-10 w-full h-full object-contain drop-shadow-[0_0_8px_rgba(0,167,255,0.4)]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
               />
            </div>
            <div className="hidden lg:block">
              <h1 className="font-ethno text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-bot-purple to-bot-pink">
                AUTOBOTZ
              </h1>
              <span className="text-[0.6rem] tracking-[0.3em] text-bot-cyan uppercase block mt-[-4px]">
                Agência de Automação
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-2">
            <NavButton 
              active={currentView === ViewState.DASHBOARD} 
              onClick={() => setCurrentView(ViewState.DASHBOARD)}
              icon={<LayoutDashboard size={20} />}
              label="Visão Geral"
            />
            <NavButton 
              active={currentView === ViewState.COURSE} 
              onClick={() => setCurrentView(ViewState.COURSE)}
              icon={<Layout size={20} />}
              label="Area de Membros"
            />
            <NavButton 
              active={currentView === ViewState.AI_LAB} 
              onClick={() => setCurrentView(ViewState.AI_LAB)}
              icon={<Cpu size={20} />}
              label="Laboratório IA"
              isNew
            />
            <NavButton 
              active={currentView === ViewState.COMMUNITY} 
              onClick={() => setCurrentView(ViewState.COMMUNITY)}
              icon={<Users size={20} />}
              label="Comunidade"
            />

            {userRole === 'ADMIN' && (
              <div className="pt-4 border-t border-white/5 mt-4 animate-in fade-in slide-in-from-left duration-500">
                 <p className="text-[10px] text-bot-cyan uppercase tracking-widest font-bold mb-2 px-4 flex items-center gap-2">
                    <Shield size={10} /> Administração
                 </p>
                 <NavButton 
                  active={currentView === ViewState.ADMIN} 
                  onClick={() => setCurrentView(ViewState.ADMIN)}
                  icon={<ShieldCheck size={20} className="text-bot-cyan" />}
                  label="Upload / Gestão"
                />
              </div>
            )}
          </nav>
        </div>

        <div className="p-6 border-t border-bot-purple/20">
          <nav className="flex flex-col gap-2">
             
             {/* USER ROLE DISPLAY */}
             <div className="bg-white/5 p-2 rounded-lg mb-2 flex flex-col items-center border border-white/5">
               <p className="text-[10px] text-gray-500 uppercase text-center mb-1">Nível de Acesso</p>
               <span className={`px-3 py-1 text-xs font-bold rounded w-full text-center transition-colors duration-300 ${
                 userRole === 'ADMIN' ? 'bg-bot-cyan text-black shadow-[0_0_10px_rgba(0,167,255,0.3)]' : 
                 userRole === 'PREMIUM' ? 'bg-bot-purple text-white shadow-[0_0_10px_rgba(73,2,166,0.3)]' : 
                 'bg-gray-700 text-gray-300'
               }`}>
                 {userRole}
               </span>
             </div>

             <NavButton 
              active={false} 
              onClick={() => {}}
              icon={<Settings size={20} />}
              label="Configurações"
            />
             <button 
                onClick={handleLogout}
                className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all group"
             >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="hidden lg:block font-medium tracking-wide">Desconectar</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative h-screen overflow-hidden flex flex-col">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-bot-purple/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-bot-cyan/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Header */}
        <header className="h-20 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between px-8 z-10 shrink-0">
          <div>
            <h2 className="text-xl font-ethno text-white tracking-widest hidden md:block">
              {currentView === ViewState.DASHBOARD && "CENTRAL DE COMANDO"}
              {currentView === ViewState.COURSE && "MÓDULO DE APRENDIZADO"}
              {currentView === ViewState.AI_LAB && "FERRAMENTAS NEURAIS"}
              {currentView === ViewState.COMMUNITY && "REDE GLOBAL"}
              {currentView === ViewState.ADMIN && "SISTEMA ADMINISTRATIVO"}
            </h2>
             {/* Mobile Title */}
             <h2 className="text-lg font-ethno text-white tracking-widest md:hidden">
              AUTOBOTZ
            </h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <p className="text-sm font-bold text-bot-cyan flex items-center gap-2 justify-end">
                 {userRole === 'ADMIN' && <Shield size={14} />}
                 {userRole === 'PREMIUM' && <Disc size={14} />}
                 {userRole === 'FREE' && <span className="w-2 h-2 rounded-full bg-gray-500"></span>}
                 Operador {userRole}
               </p>
               <p className="text-xs text-gray-500 font-mono">{session.user.email}</p>
             </div>
             <div className={`w-10 h-10 rounded-full p-[2px] ${
               userRole === 'ADMIN' ? 'bg-bot-cyan' : userRole === 'PREMIUM' ? 'bg-gradient-to-b from-bot-purple to-bot-pink' : 'bg-gray-600'
             }`}>
               <img src="https://picsum.photos/seed/user/100" alt="Avatar" className="w-full h-full rounded-full border-2 border-black" />
             </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-0">
          {loadingData ? (
             <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-bot-cyan" size={40} />
             </div>
          ) : (
             <>
                {currentView === ViewState.DASHBOARD && <Dashboard userId={session.user.id} />}
                {/* Passed fetchError to CoursePlayer */}
                {currentView === ViewState.COURSE && <CoursePlayer modules={modules} userRole={userRole} error={fetchError} />}
                {currentView === ViewState.AI_LAB && <AiImageEditor />}
                {/* PASS BACKGROUND FETCH AS PROP */}
                {currentView === ViewState.ADMIN && <AdminPanel modules={modules} setModules={setModules} onUpdate={() => fetchData(false)} />}
                {currentView === ViewState.COMMUNITY && (
                    <div className="h-full flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/5">
                    <div className="text-center">
                        <Users size={48} className="mx-auto text-bot-pink mb-4 opacity-50" />
                        <h3 className="font-ethno text-xl text-white">REDE OFFLINE</h3>
                        <p className="text-gray-400 mt-2">O módulo de comunidade está em manutenção.</p>
                    </div>
                    </div>
                )}
             </>
          )}
        </div>
      </main>
    </div>
  );
}

// Subcomponent for Navigation Buttons
interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  isNew?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, isNew }) => (
  <button
    onClick={onClick}
    className={`relative group flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 w-full ${
      active
        ? 'bg-bot-purple text-white shadow-neon-purple'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
      {icon}
    </div>
    <span className="hidden lg:block font-medium tracking-wide font-bank text-lg">{label}</span>
    
    {/* Active Indicator Line */}
    {active && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-bot-pink rounded-r shadow-[0_0_10px_#F77CFE]"></div>
    )}

    {isNew && (
      <span className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 text-[0.6rem] bg-bot-pink text-black font-bold px-1.5 py-0.5 rounded animate-pulse">
        NEW
      </span>
    )}
  </button>
);