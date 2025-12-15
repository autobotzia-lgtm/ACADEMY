import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

export const AuthLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Link de confirmação enviado para o seu email!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center font-bank relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-bot-purple/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-bot-cyan/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="bg-bot-panel/80 backdrop-blur-md border border-bot-cyan/30 p-8 rounded-2xl shadow-neon-cyan w-full max-w-md z-10 relative">
            <div className="text-center mb-8">
                {/* LOGO AREA */}
                <div className="w-32 h-32 mx-auto mb-4 relative flex items-center justify-center group">
                     <div className="absolute inset-0 bg-bot-cyan blur-3xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse"></div>
                     <img 
                        src="https://iili.io/fanwJff.png" 
                        alt="AutoBotz Logo" 
                        className="relative z-10 w-full h-full object-contain drop-shadow-[0_0_15px_rgba(0,167,255,0.6)] hover:scale-105 transition-transform duration-500"
                     />
                </div>
                
                <h1 className="font-ethno text-2xl text-white tracking-widest">AUTOBOTZ <span className="text-bot-cyan">ACCESS</span></h1>
                <p className="text-gray-400 text-sm mt-2">Identifique-se para entrar na Matrix.</p>
            </div>

            <form onSubmit={handleAuth} className="flex flex-col gap-4">
                <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-bot-cyan transition-colors" size={18} />
                    <input 
                        type="email" 
                        placeholder="Email Operacional"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-bot-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(0,167,255,0.2)] transition-all"
                        required
                    />
                </div>
                <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-bot-pink transition-colors" size={18} />
                    <input 
                        type="password" 
                        placeholder="Senha de Acesso"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-bot-pink focus:outline-none focus:shadow-[0_0_10px_rgba(247,124,254,0.2)] transition-all"
                        required
                    />
                </div>

                {error && <div className="text-red-400 text-xs bg-red-900/20 p-2 rounded border border-red-500/30 text-center">{error}</div>}
                {message && <div className="text-green-400 text-xs bg-green-900/20 p-2 rounded border border-green-500/30 text-center">{message}</div>}

                <button 
                    type="submit" 
                    disabled={loading}
                    className={`mt-4 w-full py-3 rounded-lg font-ethno tracking-wider flex items-center justify-center gap-2 transition-all duration-300 ${
                        loading ? 'bg-gray-700 cursor-wait' : 'bg-gradient-to-r from-bot-cyan to-bot-purple text-white hover:shadow-neon-cyan hover:scale-[1.02]'
                    }`}
                >
                    {loading ? <Loader2 className="animate-spin" /> : (
                        <>
                            {isSignUp ? 'INICIAR REGISTRO' : 'CONECTAR SISTEMA'} <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center border-t border-white/5 pt-4">
                <button 
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-xs text-gray-400 hover:text-bot-pink transition-colors font-bold uppercase tracking-wide"
                >
                    {isSignUp ? 'Já possui credenciais? Login' : 'Não tem acesso? Criar conta'}
                </button>
            </div>
        </div>
    </div>
  );
}