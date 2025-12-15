import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { GoogleGenAI } from "@google/genai";
import { Activity, Award, Zap, TrendingUp, BrainCircuit, Terminal, PlayCircle, Lock } from 'lucide-react';

interface DashboardProps {
  userId: string;
}

interface UserStats {
  completion: number;
  level: number;
  streak: number;
  xp: number;
  nextModule: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ userId }) => {
  const [mentorMessage, setMentorMessage] = useState<string>("Iniciando análise de perfil do operador... Clique para sincronizar.");
  const [aiLoading, setAiLoading] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    completion: 0,
    level: 1,
    streak: 0,
    xp: 0,
    nextModule: "Módulo 01: Iniciação"
  });

  // Fetch Stats from DB
  useEffect(() => {
    const fetchStats = async () => {
        try {
            const { data, error } = await supabase
                .from('user_stats')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (data) {
                setStats({
                    completion: data.completion || 0,
                    level: data.level || 1,
                    streak: data.streak || 0,
                    xp: data.xp || 0,
                    nextModule: data.next_module || "Módulo 01: Iniciação"
                });
            } else {
                // If no row found (old user before trigger or error), keep default 0s
                // Optionally insert a row here if you want lazy creation
            }
        } catch (err) {
            console.error("Error fetching stats:", err);
            // Default to 0s on error
        }
    };

    fetchStats();
  }, [userId]);

  const getLevelTitle = (lvl: number) => {
    if (lvl <= 1) return "Novato Digital";
    if (lvl <= 5) return "Scripter Iniciante";
    if (lvl <= 10) return "Automatizador Pleno";
    return "Mestre da IA";
  };

  const getAiInsight = async () => {
    setAiLoading(true);
    setMentorMessage("Estabelecendo link neural com Gemini 2.5...");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Atue como uma IA Mentora futurista chamada "AutoBotz Prime". 
        O aluno completou ${stats.completion}% do curso. 
        Nível: ${stats.level} (${getLevelTitle(stats.level)}). 
        XP: ${stats.xp}.
        Streak: ${stats.streak} dias. 
        Próximo módulo: ${stats.nextModule}.
        Dê uma mensagem curta (máximo 25 palavras) motivacional e técnica em Português.`,
      });
      setMentorMessage(response.text || "Dados corrompidos. Tente novamente.");
    } catch (e) {
      console.error(e);
      setMentorMessage("ERRO: Falha na conexão neural.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full font-bank animate-in fade-in duration-500">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Activity size={24} className="text-bot-cyan" />}
          label="Progresso Global"
          value={`${stats.completion}%`}
          subtext={stats.completion === 0 ? "Inicie sua jornada" : "Continue evoluindo"}
          color="cyan"
        />
        <StatCard 
          icon={<Zap size={24} className="text-yellow-400" />}
          label="Sequência (Streak)"
          value={`${stats.streak} Dias`}
          subtext={stats.streak === 0 ? "Sem atividade recente" : "Mantenha o fluxo"}
          color="yellow"
        />
        <StatCard 
          icon={<Award size={24} className="text-bot-pink" />}
          label="Nível Atual"
          value={`Lvl. ${stats.level.toString().padStart(2, '0')}`}
          subtext={getLevelTitle(stats.level)}
          color="pink"
        />
        <StatCard 
          icon={<TrendingUp size={24} className="text-green-400" />}
          label="Experiência (XP)"
          value={stats.xp.toLocaleString()}
          subtext="Ganhe XP assistindo aulas"
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Main Content / AI Mentor */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* AI Mentor Widget */}
          <div className="bg-bot-panel border border-bot-cyan/30 rounded-xl p-6 relative overflow-hidden shadow-neon-cyan group">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
              <BrainCircuit size={120} className="text-bot-cyan" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-bot-cyan/20 rounded-lg border border-bot-cyan">
                  <Terminal size={20} className="text-bot-cyan" />
                </div>
                <h3 className="font-ethno text-lg text-white tracking-widest">AUTOBOTZ PRIME <span className="text-xs text-bot-cyan animate-pulse">● ONLINE</span></h3>
              </div>

              <div className="bg-black/60 border border-white/10 rounded-lg p-4 mb-4 font-mono text-sm text-green-400 min-h-[80px] flex items-center">
                {aiLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-150"></span>
                    PROCESSANDO DADOS...
                  </span>
                ) : (
                  <p className="typing-effect">{mentorMessage}</p>
                )}
              </div>

              <button 
                onClick={getAiInsight}
                disabled={aiLoading}
                className="bg-bot-cyan/10 hover:bg-bot-cyan/20 text-bot-cyan border border-bot-cyan/50 hover:border-bot-cyan px-6 py-2 rounded-lg font-bold tracking-wide transition-all uppercase text-sm flex items-center gap-2"
              >
                <Zap size={16} /> {aiLoading ? "Sincronizando..." : "Solicitar Análise Tática"}
              </button>
            </div>
          </div>

          {/* Continue Watching (Static for now, but could be dynamic) */}
          <div className="flex-1 bg-bot-panel/50 border border-bot-purple/30 rounded-xl p-6 flex flex-col">
            <h3 className="font-ethno text-lg text-white mb-4 flex items-center gap-2">
              <PlayCircle className="text-bot-purple" /> Continuar Missão
            </h3>
            
            {stats.completion === 0 ? (
                <div className="flex-1 flex items-center justify-center border border-dashed border-white/10 rounded-lg bg-white/5 p-8 text-center">
                    <div>
                        <PlayCircle size={48} className="mx-auto text-gray-600 mb-4" />
                        <h4 className="text-gray-300 font-bold">Nenhuma missão em andamento</h4>
                        <p className="text-gray-500 text-sm mt-2">Acesse a Área de Membros para iniciar o Módulo 01.</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row gap-4 items-center bg-white/5 p-4 rounded-lg border border-white/5 hover:border-bot-purple transition-all cursor-pointer group">
                <div className="w-full md:w-48 aspect-video bg-black rounded-lg relative overflow-hidden">
                    <img 
                    src="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=2070&auto=format&fit=crop" 
                    alt="Thumbnail" 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                    <PlayCircle size={32} className="text-white opacity-80 group-hover:scale-110 transition-transform" />
                    </div>
                </div>
                <div className="flex-1">
                    <h4 className="text-bot-cyan font-bold text-lg">Retomar Estudos</h4>
                    <p className="text-gray-400 text-sm mb-2">{stats.nextModule}</p>
                    <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-bot-purple h-full shadow-[0_0_10px_#4902A6]" style={{ width: `${stats.completion}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1 font-mono">
                    <span>Progresso</span>
                    <span>{stats.completion}% Concluído</span>
                    </div>
                </div>
                </div>
            )}
          </div>

        </div>

        {/* Right Sidebar - Recommendations */}
        <div className="bg-bot-panel border border-white/5 rounded-xl p-6 flex flex-col gap-4">
          <h3 className="font-ethno text-lg text-white mb-2">Próximos Passos</h3>
          
          <div className="space-y-3">
             <RecommendationCard 
               title="APIs RESTful" 
               type="Técnico" 
               difficulty="Médio" 
               locked={true}
             />
             <RecommendationCard 
               title="Engenharia de Prompt" 
               type="Estratégia" 
               difficulty="Fácil" 
               locked={true}
             />
             <RecommendationCard 
               title="Deploy em Nuvem" 
               type="Infra" 
               difficulty="Difícil" 
               locked={true}
             />
          </div>

          <div className="mt-auto p-4 bg-gradient-to-br from-bot-purple/20 to-bot-pink/20 rounded-xl border border-bot-pink/30 text-center">
            <Award size={32} className="text-bot-pink mx-auto mb-2" />
            <h4 className="font-bold text-white">Certificação Beta</h4>
            <p className="text-xs text-gray-400 mt-1">
                {stats.xp < 1000 ? "Acumule 1.000 XP para desbloquear sua insígnia." : "Complete mais 3 módulos para desbloquear sua insígnia."}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, subtext, color }: any) => {
  const colorMap: any = {
    cyan: 'border-bot-cyan/30 text-bot-cyan',
    purple: 'border-bot-purple/30 text-bot-purple',
    pink: 'border-bot-pink/30 text-bot-pink',
    green: 'border-green-500/30 text-green-400',
    yellow: 'border-yellow-500/30 text-yellow-400',
  };

  return (
    <div className={`bg-bot-panel p-4 rounded-xl border ${colorMap[color].split(' ')[0]} flex flex-col gap-2 relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 p-2 opacity-10 ${colorMap[color].split(' ')[1]}`}>
        {React.cloneElement(icon, { size: 48 })}
      </div>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-gray-400 text-xs uppercase tracking-wider font-bold">{label}</span>
      </div>
      <div className="text-2xl font-ethno text-white">{value}</div>
      <div className="text-xs text-gray-500 font-mono">{subtext}</div>
    </div>
  )
}

const RecommendationCard = ({ title, type, difficulty, locked }: any) => (
  <div className={`p-3 rounded-lg border flex items-center justify-between group transition-all ${locked ? 'bg-white/5 border-white/5 opacity-70' : 'bg-bot-panel border-bot-cyan/30'}`}>
    <div>
      <h4 className="font-bold text-gray-200 text-sm group-hover:text-bot-cyan transition-colors">{title}</h4>
      <div className="flex gap-2 mt-1">
        <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400">{type}</span>
        <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400">{difficulty}</span>
      </div>
    </div>
    {locked ? <Lock size={14} className="text-gray-600" /> : <PlayCircle size={14} className="text-bot-cyan" />}
  </div>
)