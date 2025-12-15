import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Save, Trash2, Video, Crown, Unlock, Layers, Edit2, Upload, Link as LinkIcon, Image as ImageIcon, Loader2, Download, FileText } from 'lucide-react';
import { Module, Lesson, VideoType } from '../types';

interface AdminPanelProps {
  modules: Module[];
  setModules: React.Dispatch<React.SetStateAction<Module[]>>;
  onUpdate: () => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ modules, setModules, onUpdate }) => {
  const [saving, setSaving] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  // Form states
  // ADDED isPremium to moduleForm
  const [moduleForm, setModuleForm] = useState<{title: string, cover: string, isPremium: boolean}>({ 
    title: '', 
    cover: '', 
    isPremium: false 
  });
  
  const [lessonForm, setLessonForm] = useState<{
    title: string; 
    duration: string; 
    isPremium: boolean;
    videoType: VideoType;
    videoUrl: string;
    moduleId: string;
    description: string;
    materialUrl: string;
  }>({
    title: '',
    duration: '',
    isPremium: true,
    videoType: 'UPLOAD',
    videoUrl: '',
    moduleId: '',
    description: '',
    materialUrl: ''
  });

  // Refs for file inputs
  const moduleCoverInputRef = useRef<HTMLInputElement>(null);
  const lessonVideoInputRef = useRef<HTMLInputElement>(null);
  const materialInputRef = useRef<HTMLInputElement>(null);

  // --- HANDLERS FOR MODULES ---

  const handleModuleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProcessingImage(true);
      if (!file.type.startsWith('image/')) {
          alert("Por favor, selecione apenas arquivos de imagem.");
          setProcessingImage(false);
          return;
      }
      if (file.size > 2 * 1024 * 1024) {
          alert("Imagem muito grande! Use arquivos menores que 2MB para salvar no banco.");
          setProcessingImage(false);
          return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setModuleForm(prev => ({ ...prev, cover: result }));
        setProcessingImage(false);
      };
      reader.onerror = () => {
          alert("Erro ao ler arquivo.");
          setProcessingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveModule = async () => {
    if (!moduleForm.title.trim()) {
        alert("Digite um título para o módulo.");
        return;
    }
    if (processingImage) {
        alert("Aguarde o processamento da imagem...");
        return;
    }
    setSaving(true);

    try {
        const payload = {
            title: moduleForm.title,
            cover_image: moduleForm.cover && moduleForm.cover.length > 0 ? moduleForm.cover : null,
            is_premium: moduleForm.isPremium // Sending premium status
        };

        if (editingModuleId) {
            // Update Supabase
            const { error } = await supabase
                .from('modules')
                .update(payload)
                .eq('id', editingModuleId);
            
            if (error) throw error;
        } else {
            // Create Supabase
            const { error } = await supabase
                .from('modules')
                .insert([payload]);
            
            if (error) throw error;
        }
        
        // Wait a moment for DB propagation before fetching
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Trigger silent update
        await onUpdate();
        
        // Reset Form
        setModuleForm({ title: '', cover: '', isPremium: false });
        setEditingModuleId(null);
        if (moduleCoverInputRef.current) moduleCoverInputRef.current.value = '';
        alert("Módulo salvo com sucesso!");
    } catch (err: any) {
        console.error("Error saving module:", err);
        alert(`Erro ao salvar módulo: ${err.message}. Verifique as Policies (RLS) do Supabase ou se a coluna 'is_premium' existe.`);
    } finally {
        setSaving(false);
    }
  };

  const startEditModule = (mod: Module) => {
    setEditingModuleId(mod.id);
    setModuleForm({ title: mod.title, cover: mod.coverImage || '', isPremium: mod.isPremium });
    setEditingLessonId(null);
    setLessonForm(prev => ({ ...prev, moduleId: mod.id }));
  };

  // --- HANDLERS FOR LESSONS ---

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // WARNING: Local Object URL cannot be saved to DB for other users
      alert("Aviso: Upload de vídeo local não funciona bem apenas com Banco de Dados. Para produção, use links do YouTube/Vimeo/Drive ou configure um Storage.");
      const objectUrl = URL.createObjectURL(file);
      setLessonForm(prev => ({ ...prev, videoUrl: objectUrl }));
    }
  };

  const handleMaterialUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 1 * 1024 * 1024) { // 1MB limit for base64 in DB
              alert("Arquivo muito grande para salvar direto no banco! Use um link externo (Drive/Dropbox) ou um arquivo menor que 1MB.");
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              setLessonForm(prev => ({ ...prev, materialUrl: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const saveLesson = async () => {
    // Validation
    if (!lessonForm.moduleId) {
        alert("Selecione um Módulo para a aula!");
        return;
    }
    if (!lessonForm.title) {
        alert("Digite o título da aula!");
        return;
    }
    if (!lessonForm.duration) {
        alert("Digite a duração da aula!");
        return;
    }

    setSaving(true);
    
    let finalVideoUrl = lessonForm.videoUrl;

    if (lessonForm.videoType === 'DRIVE') {
        const match = lessonForm.videoUrl.match(/\/d\/(.+?)(\/|$)/);
        if (match && match[1]) {
            finalVideoUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
        }
    }

    try {
        const payload = {
            title: lessonForm.title,
            duration: lessonForm.duration,
            is_premium: lessonForm.isPremium,
            video_type: lessonForm.videoType,
            video_url: finalVideoUrl,
            module_id: lessonForm.moduleId,
            description: lessonForm.description,
            material_url: lessonForm.materialUrl
        };

        if (editingLessonId) {
            // Update Supabase
            const { error } = await supabase
                .from('lessons')
                .update(payload)
                .eq('id', editingLessonId);
            
            if (error) throw error;
        } else {
            // Create Supabase
            const { error } = await supabase
                .from('lessons')
                .insert([payload]);

            if (error) throw error;
        }

        // Wait a moment for DB propagation before fetching
        await new Promise(resolve => setTimeout(resolve, 500));

        // Refresh Data from Server
        await onUpdate();

        // Reset
        setLessonForm({ 
            title: '', 
            duration: '', 
            isPremium: true, 
            videoType: 'UPLOAD', 
            videoUrl: '', 
            moduleId: lessonForm.moduleId,
            description: '',
            materialUrl: ''
        });
        setEditingLessonId(null);
        alert("Aula salva com sucesso!");

    } catch (err: any) {
        console.error("Error saving lesson:", err);
        alert(`Erro ao salvar aula: ${err.message}. Verifique as Policies (RLS) do Supabase.`);
    } finally {
        setSaving(false);
    }
  };

  const startEditLesson = (modId: string, lesson: Lesson) => {
      setEditingLessonId(lesson.id);
      setLessonForm({
          title: lesson.title,
          duration: lesson.duration,
          isPremium: lesson.isPremium,
          videoType: lesson.videoType,
          videoUrl: lesson.videoUrl,
          moduleId: modId,
          description: lesson.description || '',
          materialUrl: lesson.materialUrl || ''
      });
      setEditingModuleId(null);
  };

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    if(!window.confirm("Confirmar exclusão?")) return;
    
    try {
        const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
        if(error) throw error;

        await onUpdate();
    } catch (err: any) {
        console.error(err);
        alert(`Erro ao deletar: ${err.message}`);
    }
  };

  return (
    <div className="h-full font-bank overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-ethno text-transparent bg-clip-text bg-gradient-to-r from-bot-cyan to-bot-purple">
          PAINEL DE COMANDO (ADM)
        </h2>
        <p className="text-gray-400">Gerenciamento via Supabase Database.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CREATE/EDIT FORMS */}
        <div className="flex flex-col gap-8">
          
          {/* Module Form */}
          <div className={`bg-bot-panel border ${editingModuleId ? 'border-bot-pink shadow-neon-pink' : 'border-bot-cyan/30'} rounded-xl p-6 transition-all duration-300`}>
            <h3 className="text-xl font-ethno text-white mb-4 flex items-center gap-2">
              <Layers className={editingModuleId ? 'text-bot-pink' : 'text-bot-cyan'} /> 
              {editingModuleId ? 'EDITAR MÓDULO' : 'NOVO MÓDULO'}
            </h3>
            
            <div className="flex flex-col gap-4">
               <input 
                type="text" 
                value={moduleForm.title}
                onChange={(e) => setModuleForm({...moduleForm, title: e.target.value})}
                placeholder="Título do Módulo"
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-bot-cyan focus:outline-none"
              />
              
              {/* Premium Toggle for Module */}
              <div 
                onClick={() => setModuleForm({...moduleForm, isPremium: !moduleForm.isPremium})}
                className={`cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all w-full ${moduleForm.isPremium ? 'bg-bot-purple/20 border-bot-purple text-bot-pink' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}
              >
                {moduleForm.isPremium ? <Crown size={20} /> : <Unlock size={20} />}
                <span className="font-bold text-sm">{moduleForm.isPremium ? 'MÓDULO PREMIUM (FECHADO)' : 'MÓDULO GRATUITO (ABERTO)'}</span>
              </div>

              <div className="flex gap-4 items-center">
                 <div 
                   onClick={() => moduleCoverInputRef.current?.click()}
                   className={`flex-1 border-2 border-dashed rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-bot-cyan hover:bg-white/5 transition-all overflow-hidden relative ${moduleForm.cover ? 'border-bot-pink' : 'border-white/10'}`}
                 >
                    <input type="file" ref={moduleCoverInputRef} className="hidden" accept="image/*" onChange={handleModuleCoverUpload} />
                    
                    {processingImage ? (
                        <div className="flex flex-col items-center text-bot-cyan">
                            <Loader2 className="animate-spin mb-2" />
                            <span className="text-xs">Processando...</span>
                        </div>
                    ) : moduleForm.cover ? (
                        <img src={moduleForm.cover} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                        <>
                           <ImageIcon className="mb-2 text-gray-500" />
                           <span className="text-xs text-gray-500 font-bold">CAPA (9:16)</span>
                        </>
                    )}
                 </div>
                 
                 <button 
                  onClick={saveModule}
                  disabled={!moduleForm.title || saving || processingImage}
                  className={`h-32 px-6 rounded-lg font-bold flex flex-col items-center justify-center gap-2 transition-all ${editingModuleId ? 'bg-bot-pink text-black' : 'bg-bot-cyan/20 text-bot-cyan border border-bot-cyan'}`}
                 >
                   {saving ? <Loader2 className="animate-spin" /> : editingModuleId ? <Save size={24} /> : <Plus size={24} />}
                   {editingModuleId ? 'ATUALIZAR' : 'CRIAR'}
                 </button>
              </div>
            </div>
          </div>

          {/* Lesson Form */}
          <div className={`bg-bot-panel border ${editingLessonId ? 'border-bot-pink shadow-neon-pink' : 'border-bot-purple/30'} rounded-xl p-6 transition-all duration-300`}>
            <h3 className="text-xl font-ethno text-white mb-4 flex items-center gap-2">
              <Video className={editingLessonId ? 'text-bot-pink' : 'text-bot-purple'} /> 
              {editingLessonId ? 'EDITAR AULA' : 'UPLOAD DE AULA'}
            </h3>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Módulo Alvo</label>
                <select 
                  value={lessonForm.moduleId}
                  onChange={(e) => setLessonForm({...lessonForm, moduleId: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-bot-purple focus:outline-none"
                  disabled={!!editingLessonId}
                >
                  <option value="" className="bg-[#12121f] text-gray-400">-- Selecione --</option>
                  {modules.map(m => (
                    <option key={m.id} value={m.id} className="bg-[#12121f] text-white">
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Título da Aula</label>
                <input 
                  type="text" 
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})}
                  placeholder="Ex: Integrando com WhatsApp API"
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-bot-purple focus:outline-none"
                />
              </div>

              {/* VIDEO SOURCE SELECTOR */}
              <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                 <label className="text-xs text-gray-500 uppercase font-bold mb-3 block">Origem do Vídeo</label>
                 <div className="flex gap-2 mb-4">
                    <button 
                      onClick={() => setLessonForm({...lessonForm, videoType: 'UPLOAD'})}
                      className={`flex-1 py-2 text-xs font-bold rounded flex items-center justify-center gap-2 ${lessonForm.videoType === 'UPLOAD' ? 'bg-bot-cyan text-black' : 'bg-white/5 text-gray-400'}`}
                    >
                        <Upload size={14} /> UPLOAD
                    </button>
                    <button 
                      onClick={() => setLessonForm({...lessonForm, videoType: 'DRIVE'})}
                      className={`flex-1 py-2 text-xs font-bold rounded flex items-center justify-center gap-2 ${lessonForm.videoType === 'DRIVE' ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-400'}`}
                    >
                        <LinkIcon size={14} /> DRIVE/LINK
                    </button>
                 </div>

                 {/* DYNAMIC INPUT BASED ON TYPE */}
                 {lessonForm.videoType === 'DRIVE' && (
                     <input 
                       type="text" 
                       value={lessonForm.videoUrl} 
                       onChange={(e) => setLessonForm({...lessonForm, videoUrl: e.target.value})}
                       placeholder="Link do Google Drive (Acesso Público)"
                       className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm text-white"
                     />
                 )}
                 {lessonForm.videoType === 'UPLOAD' && (
                     <div 
                       onClick={() => lessonVideoInputRef.current?.click()}
                       className="border border-dashed border-white/20 rounded p-4 text-center cursor-pointer hover:bg-white/5"
                     >
                        <input type="file" ref={lessonVideoInputRef} className="hidden" accept="video/*" onChange={handleVideoUpload} />
                        <span className="text-xs text-gray-400">{lessonForm.videoUrl ? 'VÍDEO CARREGADO NA MEMÓRIA (NÃO PERSISTENTE)' : 'CLIQUE PARA SELECIONAR ARQUIVO LOCAL'}</span>
                     </div>
                 )}
              </div>

              {/* DESCRIPTION & MATERIALS */}
              <div>
                 <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Descrição da Aula (Opcional)</label>
                 <textarea 
                   value={lessonForm.description}
                   onChange={(e) => setLessonForm({...lessonForm, description: e.target.value})}
                   placeholder="Detalhes sobre o conteúdo, prompts utilizados, etc."
                   className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-bot-purple focus:outline-none h-24 resize-none"
                 />
              </div>

              <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Material Complementar (Download)</label>
                  <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={lessonForm.materialUrl}
                        onChange={(e) => setLessonForm({...lessonForm, materialUrl: e.target.value})}
                        placeholder="Link Externo (Drive/Dropbox) ou Upload"
                        className="flex-1 bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-bot-purple focus:outline-none"
                      />
                      <button 
                         onClick={() => materialInputRef.current?.click()}
                         className="px-4 bg-white/10 border border-white/10 rounded-lg hover:bg-white/20 hover:text-bot-cyan transition-colors"
                         title="Upload Arquivo (Pequeno)"
                      >
                         <Upload size={18} />
                         <input type="file" ref={materialInputRef} className="hidden" onChange={handleMaterialUpload} />
                      </button>
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1">*Para arquivos grandes, use link externo. Limite 1MB para upload direto.</p>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Duração</label>
                  <input 
                    type="text" 
                    value={lessonForm.duration}
                    onChange={(e) => setLessonForm({...lessonForm, duration: e.target.value})}
                    placeholder="MM:SS"
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-bot-purple focus:outline-none"
                  />
                </div>
                
                <div className="flex-1 flex flex-col justify-end">
                  <div 
                    onClick={() => setLessonForm({...lessonForm, isPremium: !lessonForm.isPremium})}
                    className={`cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${lessonForm.isPremium ? 'bg-bot-purple/20 border-bot-purple text-bot-pink' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}
                  >
                    {lessonForm.isPremium ? <Crown size={20} /> : <Unlock size={20} />}
                    <span className="font-bold text-sm">{lessonForm.isPremium ? 'PREMIUM' : 'GRÁTIS'}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={saveLesson}
                disabled={saving}
                className={`w-full mt-2 text-white font-bold py-3 rounded-lg shadow-neon-purple hover:shadow-neon-pink transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${editingLessonId ? 'bg-bot-pink' : 'bg-gradient-to-r from-bot-purple to-bot-pink'}`}
              >
                {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />} {editingLessonId ? 'ATUALIZAR AULA' : 'SALVAR AULA NO BANCO'}
              </button>
            </div>
          </div>

        </div>

        {/* PREVIEW LIST */}
        <div className="bg-black/30 border border-white/5 rounded-xl p-6 overflow-y-auto max-h-[800px]">
          <h3 className="text-lg font-ethno text-gray-400 mb-4">ESTRUTURA ATUAL (DB)</h3>
          
          <div className="space-y-6">
            {modules.map((module) => (
              <div key={module.id} className={`border rounded-lg overflow-hidden transition-all ${editingModuleId === module.id ? 'border-bot-pink bg-bot-pink/5' : 'border-white/10'}`}>
                <div className="bg-white/5 p-3 flex justify-between items-center group">
                   <div className="flex items-center gap-3">
                      {module.coverImage && module.coverImage !== "EMPTY" && module.coverImage !== "NULL" ? (
                          <div className="w-8 h-14 bg-gray-800 rounded overflow-hidden">
                              <img src={module.coverImage} alt="Cover" className="w-full h-full object-cover" />
                          </div>
                      ) : (
                          <div className="w-8 h-14 bg-white/5 rounded border border-white/10 flex items-center justify-center">
                              <ImageIcon size={16} className="text-gray-600" />
                          </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                           <h4 className="text-bot-cyan font-bold uppercase tracking-wider text-sm">{module.title}</h4>
                           {module.isPremium && <Crown size={12} className="text-bot-pink" />}
                        </div>
                        <span className="text-xs text-gray-500">{module.lessons.length} Aulas</span>
                      </div>
                   </div>
                   <button onClick={() => startEditModule(module)} className="text-gray-600 hover:text-bot-cyan p-2">
                       <Edit2 size={16} />
                   </button>
                </div>
                <div>
                  {module.lessons.length === 0 ? (
                    <div className="p-4 text-center text-gray-600 text-sm italic">Nenhuma aula neste módulo</div>
                  ) : (
                    module.lessons.map((lesson) => (
                      <div key={lesson.id} className={`p-3 border-t border-white/5 flex items-center justify-between hover:bg-white/5 transition-colors group ${editingLessonId === lesson.id ? 'bg-bot-purple/20' : ''}`}>
                         <div className="flex items-center gap-3">
                           {lesson.isPremium ? (
                             <Crown size={14} className="text-bot-pink" />
                           ) : (
                             <Unlock size={14} className="text-green-400" />
                           )}
                           <div className="flex flex-col">
                                <span className="text-sm text-gray-300">{lesson.title}</span>
                                {lesson.materialUrl && (
                                    <span className="text-[10px] text-bot-cyan flex items-center gap-1"><Download size={8} /> Material Anexado</span>
                                )}
                           </div>
                         </div>
                         <div className="flex items-center gap-2">
                            {/* Visual indicator for video type */}
                            {lesson.videoType === 'UPLOAD' && <Upload size={12} className="text-bot-cyan" />}
                            {lesson.videoType === 'DRIVE' && <LinkIcon size={12} className="text-green-500" />}
                            
                            <span className="text-xs font-mono text-gray-600 mx-2">{lesson.duration}</span>
                            
                            <button 
                                onClick={() => startEditLesson(module.id, lesson)}
                                className="text-gray-500 hover:text-white transition-colors p-1"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteLesson(module.id, lesson.id)}
                              className="text-red-500/50 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                         </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};