import React, { useState, useEffect } from 'react';
import { Play, Lock, CheckCircle, Crown, AlertTriangle, Download, FileText, Database, ShieldAlert, Terminal, Copy, ArrowLeft, PlayCircle, Grid } from 'lucide-react';
import { Module, Lesson, UserRole } from '../types';

interface CoursePlayerProps {
  modules: Module[];
  userRole: UserRole;
  error?: string | null;
}

export const CoursePlayer: React.FC<CoursePlayerProps> = ({ modules, userRole, error }) => {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [viewMode, setViewMode] = useState<'GALLERY' | 'PLAYER'>('GALLERY');

  // If modules change significantly, reset to gallery
  useEffect(() => {
    if (modules.length === 0) {
        setViewMode('GALLERY');
        setActiveLesson(null);
    }
  }, [modules]);

  // --- DIAGNOSTIC MODE: ERROR HANDLING & EMPTY STATE ---
  if (error || modules.length === 0) {
    const isColumnError = error && error.includes('column') && error.includes('does not exist');
    
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 overflow-y-auto">
            <div className={`p-6 rounded-xl border max-w-2xl w-full text-left relative overflow-hidden ${error ? 'bg-red-950/30 border-red-500/50' : 'bg-bot-panel border-bot-cyan/30'}`}>
                <div className="flex items-center gap-3 mb-4">
                    {error ? <ShieldAlert size={32} className="text-red-500" /> : <Database size={32} className="text-bot-cyan animate-pulse" />}
                    <h2 className="text-2xl font-ethno text-white">
                        {error ? "FALHA NO PROTOCOLO DE DADOS" : "BANCO DE DADOS DESCONECTADO (RLS)"}
                    </h2>
                </div>

                <p className="text-gray-300 mb-4 font-mono text-sm">
                    {isColumnError 
                        ? "DIAGNÓSTICO: O aplicativo tentou acessar colunas novas ('description', 'material_url' ou 'is_premium') que não existem na tabela." 
                        : error 
                            ? `ERRO: ${error}` 
                            : "DIAGNÓSTICO: As tabelas existem, mas as Policies (Regras de Segurança) do Supabase estão bloqueando o acesso de leitura."
                    }
                </p>

                <div className="bg-black p-4 rounded-lg border border-white/10 font-mono text-xs text-green-400 overflow-x-auto relative group">
                    <p className="text-gray-500 mb-2 border-b border-white/10 pb-1">-- COLE ISSO NO EDITOR SQL DO SUPABASE --</p>
                    <pre className="whitespace-pre-wrap select-all">
{isColumnError ? 
`-- CORREÇÃO DE COLUNAS FALTANTES
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS material_url TEXT;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;` 
: 
`-- CORREÇÃO DE PERMISSÕES (RLS)
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública (todos os usuários logados veem os cursos)
CREATE POLICY "Public Read Modules" ON modules FOR SELECT USING (true);
CREATE POLICY "Public Read Lessons" ON lessons FOR SELECT USING (true);

-- Permitir inserção/update apenas para autenticados (Admin)
-- Ajuste para suas regras reais de produção
CREATE POLICY "Auth Insert Modules" ON modules FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Update Modules" ON modules FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Insert Lessons" ON lessons FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Update Lessons" ON lessons FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Delete Lessons" ON lessons FOR DELETE USING (auth.role() = 'authenticated');`
}
                    </pre>
                    <button 
                        onClick={() => {
                            const text = isColumnError 
                            ? `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS description TEXT; ALTER TABLE lessons ADD COLUMN IF NOT EXISTS material_url TEXT; ALTER TABLE modules ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;`
                            : `ALTER TABLE modules ENABLE ROW LEVEL SECURITY; ALTER TABLE lessons ENABLE ROW LEVEL SECURITY; CREATE POLICY "Public Read Modules" ON modules FOR SELECT USING (true); CREATE POLICY "Public Read Lessons" ON lessons FOR SELECT USING (true); CREATE POLICY "Auth Insert Modules" ON modules FOR INSERT WITH CHECK (auth.role() = 'authenticated'); CREATE POLICY "Auth Update Modules" ON modules FOR UPDATE USING (auth.role() = 'authenticated'); CREATE POLICY "Auth Insert Lessons" ON lessons FOR INSERT WITH CHECK (auth.role() = 'authenticated'); CREATE POLICY "Auth Update Lessons" ON lessons FOR UPDATE USING (auth.role() = 'authenticated'); CREATE POLICY "Auth Delete Lessons" ON lessons FOR DELETE USING (auth.role() = 'authenticated');`
                            navigator.clipboard.writeText(text);
                            alert("SQL Copiado!");
                        }}
                        className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 p-2 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copiar SQL"
                    >
                        <Copy size={14} />
                    </button>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                    <Terminal size={12} />
                    <span>Acesse o Supabase Dashboard {'>'} SQL Editor {'>'} Cole o código acima e clique em RUN.</span>
                </div>
            </div>
        </div>
    );
  }

  // --- HELPER: CHECK ACCESS ---
  const hasAccess = (lesson: Lesson) => {
    if (userRole === 'ADMIN') return true;
    if (lesson.isPremium && userRole === 'FREE') return false;
    return true; 
  };

  const hasModuleAccess = (module: Module) => {
      if (userRole === 'ADMIN') return true;
      if (module.isPremium && userRole === 'FREE') return false;
      return true;
  };

  // --- VIEW 1: MODULE GALLERY (NETFLIX STYLE) ---
  if (viewMode === 'GALLERY') {
    return (
        <div className="h-full overflow-y-auto p-4 animate-in fade-in duration-500">
            <div className="mb-8">
                <h2 className="text-3xl font-ethno text-white tracking-widest flex items-center gap-3">
                    <Grid className="text-bot-pink" /> 
                    MÓDULOS DE TREINAMENTO
                </h2>
                <p className="text-bot-cyan/60 font-bank text-lg">Selecione uma matriz de conhecimento para iniciar.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {modules.map((module) => {
                   const hasLessons = module.lessons.length > 0;
                   const isLocked = !hasModuleAccess(module);

                   return (
                       <div 
                         key={module.id}
                         onClick={() => {
                             if (isLocked) {
                                 alert("ACESSO NEGADO: Módulo Premium. Faça upgrade para desbloquear.");
                                 return;
                             }
                             if (hasLessons) {
                                 setActiveLesson(module.lessons[0]);
                                 setViewMode('PLAYER');
                             } else {
                                 alert("Este módulo ainda não possui aulas.");
                             }
                         }}
                         className={`group relative aspect-[9/16] rounded-xl overflow-hidden border bg-bot-panel cursor-pointer transition-all duration-500 
                            ${isLocked 
                                ? 'border-gray-800 grayscale hover:grayscale-0' // Locked state style
                                : 'border-white/10 hover:border-bot-cyan hover:shadow-neon-cyan hover:scale-105' // Unlocked state style
                            }
                         `}
                       >
                           {/* Cover Image */}
                           {module.coverImage && module.coverImage !== "EMPTY" && module.coverImage !== "NULL" ? (
                               <img 
                                 src={module.coverImage} 
                                 alt={module.title} 
                                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                               />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center bg-white/5">
                                   <Database size={40} className="text-gray-600 group-hover:text-bot-cyan transition-colors" />
                               </div>
                           )}

                           {/* Overlay Gradient */}
                           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>

                           {/* LOCKED OVERLAY ICON */}
                           {isLocked && (
                               <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[1px] z-20">
                                   <div className="w-12 h-12 rounded-full border border-gray-500 flex items-center justify-center mb-2">
                                       <Lock className="text-gray-400" size={24} />
                                   </div>
                                   <span className="text-xs text-gray-400 font-ethno tracking-widest uppercase">Bloqueado</span>
                               </div>
                           )}

                           {/* Content info */}
                           <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform z-10">
                               <div className="flex justify-between items-center mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <p className="text-[10px] text-bot-cyan uppercase font-bold tracking-widest">
                                        {module.lessons.length} AULAS
                                   </p>
                                   {module.isPremium && !isLocked && <Crown size={12} className="text-bot-pink" />}
                               </div>
                               
                               <h3 className={`text-lg font-ethno leading-tight shadow-black drop-shadow-md ${isLocked ? 'text-gray-400' : 'text-white'}`}>
                                   {module.title}
                               </h3>
                               {!isLocked && (
                                   <div className="h-1 w-0 bg-bot-pink mt-2 group-hover:w-full transition-all duration-500"></div>
                               )}
                           </div>

                           {/* Play Overlay Icon on Hover (Only if unlocked) */}
                           {!isLocked && (
                               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
                                   <div className="w-16 h-16 rounded-full bg-bot-cyan/20 border border-bot-cyan flex items-center justify-center backdrop-blur-md shadow-[0_0_30px_rgba(0,167,255,0.4)]">
                                       <Play size={32} className="text-white fill-white ml-1" />
                                   </div>
                               </div>
                           )}
                       </div>
                   )
                })}
            </div>
        </div>
    );
  }

  // --- VIEW 2: PLAYER MODE ---
  
  if (!activeLesson) return null; // Should not happen due to logic above

  const isCurrentLessonLocked = !hasAccess(activeLesson);

  return (
    <div className="flex flex-col h-full font-bank animate-in slide-in-from-right duration-500">
      
      {/* Back Navigation Bar */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/5">
          <button 
            onClick={() => setViewMode('GALLERY')}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-all border border-white/5 hover:border-bot-purple group"
          >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold tracking-wide">VOLTAR AOS MÓDULOS</span>
          </button>
          <div className="h-6 w-px bg-white/10"></div>
          <span className="text-gray-500 text-sm flex items-center gap-2">
             <PlayCircle size={14} /> Reproduzindo
          </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
            <div className="relative aspect-video bg-black/50 border border-bot-cyan/30 rounded-xl overflow-hidden shadow-neon-cyan group shrink-0">
            
            {isCurrentLessonLocked ? (
                // LOCKED OVERLAY
                <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                    <div className="w-20 h-20 bg-bot-purple/20 rounded-full flex items-center justify-center mb-4 border border-bot-purple shadow-neon-purple animate-pulse">
                    <Lock size={40} className="text-bot-pink" />
                    </div>
                    <h2 className="text-2xl font-ethno text-white mb-2">CONTEÚDO PREMIUM</h2>
                    <p className="text-gray-400 max-w-md mb-6">Esta aula de nível avançado é exclusiva para membros da elite. Faça o upgrade do seu sistema para acessar.</p>
                    <button className="bg-gradient-to-r from-bot-purple to-bot-pink text-white font-bold py-3 px-8 rounded-full shadow-neon-pink hover:scale-105 transition-transform font-ethno tracking-wide">
                    DESBLOQUEAR ACESSO
                    </button>
                </div>
            ) : (
                // VIDEO PLAYER SWITCHER
                <div className="w-full h-full bg-black">
                    {activeLesson.videoType === 'DRIVE' && activeLesson.videoUrl ? (
                        <iframe 
                            width="100%" 
                            height="100%" 
                            src={activeLesson.videoUrl} 
                            title={activeLesson.title}
                            allow="autoplay; fullscreen"
                            className="w-full h-full border-0"
                        ></iframe>
                    ) : activeLesson.videoUrl ? (
                        <video 
                            controls 
                            autoPlay
                            className="w-full h-full object-contain"
                            src={activeLesson.videoUrl}
                        >
                            Seu navegador não suporta a tag de vídeo.
                        </video>
                    ) : (
                        // Fallback if no URL
                        <div className="absolute inset-0 flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1965&auto=format&fit=crop')] bg-cover bg-center opacity-50">
                            <div className="bg-black/80 p-6 rounded-xl border border-red-500/50 flex flex-col items-center">
                                <AlertTriangle size={32} className="text-red-500 mb-2" />
                                <p className="text-white">Fonte de vídeo não encontrada ou corrompida.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent z-10 pointer-events-none">
                <h2 className="text-2xl font-ethno text-white tracking-wider flex items-center gap-3">
                {activeLesson.title}
                {activeLesson.isPremium && <Crown size={20} className="text-bot-pink" />}
                </h2>
            </div>
            </div>

            <div className="p-6 bg-bot-panel/50 border border-bot-purple/30 rounded-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-ethno text-bot-pink">Dados da Missão</h3>
                    {activeLesson.isPremium ? (
                    <span className="px-3 py-1 bg-bot-purple/20 border border-bot-purple text-bot-pink text-xs rounded font-bold flex items-center gap-1">
                        <Crown size={12} /> PREMIUM
                    </span>
                    ) : (
                    <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded font-bold">
                        FREE ACESS
                    </span>
                    )}
                </div>

                {/* DOWNLOAD BUTTON */}
                {activeLesson.materialUrl && !isCurrentLessonLocked && (
                    <a 
                    href={activeLesson.materialUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-bot-cyan/10 hover:bg-bot-cyan/20 text-bot-cyan border border-bot-cyan/50 hover:border-bot-cyan px-4 py-2 rounded-lg transition-all text-sm font-bold uppercase"
                    >
                        <Download size={16} /> Material de Apoio
                    </a>
                )}
            </div>
            
            <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap font-sans text-sm">
                    {isCurrentLessonLocked 
                    ? "Conteúdo criptografado. Nível de acesso insuficiente para visualizar a descrição tática desta operação." 
                    : activeLesson.description || "Nenhuma descrição operacional fornecida para este módulo."
                    }
                </p>
            </div>
            </div>
        </div>

        {/* Playlist / Sidebar */}
        <div className="w-full lg:w-96 flex flex-col gap-4 h-full">
            <div className="bg-bot-panel border border-bot-purple/30 rounded-xl overflow-hidden flex flex-col h-full">
            <div className="p-4 bg-bot-purple/20 border-b border-bot-purple/30 flex justify-between items-center">
                <h3 className="font-ethno text-lg text-white">Database</h3>
                <span className="text-xs text-bot-cyan font-mono border border-bot-cyan/30 px-2 py-1 rounded">
                {userRole === 'ADMIN' ? 'ADM MODE' : userRole === 'PREMIUM' ? 'PRO MEMBER' : 'FREE TIER'}
                </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {modules.map((module) => {
                    // Check if this module contains the active lesson to auto-expand or highlight
                    const isActiveModule = module.lessons.some(l => l.id === activeLesson?.id);
                    
                    return (
                        <div key={module.id} className={`relative transition-opacity ${isActiveModule ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                            {/* Module Header with Cover */}
                            <div className="flex items-end gap-3 mb-3">
                                {module.coverImage && module.coverImage !== "EMPTY" && module.coverImage !== "NULL" ? (
                                    <div className={`w-12 h-20 shrink-0 rounded-md overflow-hidden border shadow-lg bg-black ${isActiveModule ? 'border-bot-pink shadow-neon-pink' : 'border-white/10'}`}>
                                        <img src={module.coverImage} alt={module.title} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-12 h-20 shrink-0 rounded-md border border-white/10 bg-white/5 flex items-center justify-center">
                                        <Database size={16} className="text-gray-600" />
                                    </div>
                                )}
                                <div className="w-full border-b border-white/10 pb-1">
                                    <h4 className={`font-bold uppercase tracking-wider text-sm ${isActiveModule ? 'text-bot-pink' : 'text-gray-400'}`}>{module.title}</h4>
                                    {module.isPremium && <span className="text-[10px] text-bot-purple font-bold flex items-center gap-1"><Crown size={8}/> PREMIUM</span>}
                                </div>
                            </div>

                            <div className="space-y-2 pl-2 border-l border-white/5 ml-4">
                            {module.lessons.map((lesson) => {
                                const isActive = activeLesson?.id === lesson.id;
                                const canAccess = hasAccess(lesson);
                                
                                return (
                                <button
                                    key={lesson.id}
                                    onClick={() => setActiveLesson(lesson)}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                                    isActive
                                        ? 'bg-bot-cyan/20 border-bot-cyan text-white shadow-neon-cyan'
                                        : !canAccess
                                        ? 'bg-transparent border-white/5 text-gray-500 opacity-70 hover:opacity-100 hover:border-bot-pink/50'
                                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-bot-purple'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                    {!canAccess ? (
                                        <Lock size={16} className="text-bot-pink shrink-0" />
                                    ) : isActive ? (
                                        <div className="w-4 h-4 rounded-full bg-bot-cyan animate-pulse shrink-0" />
                                    ) : (
                                        <CheckCircle size={16} className="text-bot-purple shrink-0" />
                                    )}
                                    
                                    <div className="flex flex-col items-start">
                                        <span className="text-sm font-medium text-left line-clamp-1">{lesson.title}</span>
                                    </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                    {lesson.materialUrl && <FileText size={10} className="text-bot-cyan opacity-50" />}
                                    {lesson.isPremium && <Crown size={12} className="text-bot-pink" />}
                                    <span className="text-xs opacity-60 font-mono">{lesson.duration}</span>
                                    </div>
                                </button>
                                );
                            })}
                            {module.lessons.length === 0 && (
                                <p className="text-xs text-gray-600 italic">Sem aulas.</p>
                            )}
                            </div>
                        </div>
                    );
                })}
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};