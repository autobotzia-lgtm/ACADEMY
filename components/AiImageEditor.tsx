import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upload, Sparkles, Image as ImageIcon, Download, RefreshCw, X } from 'lucide-react';

// Using a custom hook for handling file uploads helps keep the component clean
const useImageUpload = () => {
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return { image, handleFileChange, fileInputRef, clearImage };
};

export const AiImageEditor: React.FC = () => {
  const { image: originalImage, handleFileChange, fileInputRef, clearImage } = useImageUpload();
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!originalImage || !prompt) return;
    
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Remove data:image/png;base64, prefix for the API
      const base64Data = originalImage.split(',')[1];
      const mimeType = originalImage.match(/:(.*?);/)?.[1] || 'image/png';

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // Specific Nano Banana model
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      // Parse response for image
      let foundImage = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const resultBase64 = part.inlineData.data;
            const resultMime = part.inlineData.mimeType || 'image/png';
            setGeneratedImage(`data:${resultMime};base64,${resultBase64}`);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) {
        // Fallback if the model returns text explaining why it couldn't generate
        const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
        if (textPart) {
          throw new Error(textPart.text || "Failed to generate image.");
        } else {
          throw new Error("No image data received from API.");
        }
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during generation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col font-bank relative">
      <div className="mb-6">
        <h2 className="text-3xl font-ethno text-transparent bg-clip-text bg-gradient-to-r from-bot-cyan to-bot-pink">
          LABORATÓRIO VISUAL NEURAL
        </h2>
        <p className="text-bot-cyan/60">Edite realidades usando o poder do Gemini 2.5 Flash.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* INPUT SECTION */}
        <div className="bg-bot-panel border border-bot-cyan/20 rounded-xl p-6 flex flex-col gap-6 relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-bot-cyan/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <h3 className="text-xl font-ethno text-white flex items-center gap-2">
            <Upload size={20} className="text-bot-cyan" /> INPUT
          </h3>

          {!originalImage ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 border-2 border-dashed border-bot-cyan/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-bot-cyan/5 hover:border-bot-cyan transition-all group-hover:shadow-[inset_0_0_20px_rgba(0,167,255,0.1)]"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              <ImageIcon size={48} className="text-bot-cyan mb-4 opacity-50" />
              <p className="text-gray-400 font-bold">CARREGAR MATRIZ VISUAL</p>
              <p className="text-xs text-gray-600 mt-2 uppercase tracking-widest">Suporta JPG, PNG, WEBP</p>
            </div>
          ) : (
            <div className="flex-1 relative rounded-lg overflow-hidden border border-bot-cyan/30 bg-black">
               {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
              <img src={originalImage} alt="Source" className="w-full h-full object-contain" />
              <button 
                onClick={clearImage}
                className="absolute top-2 right-2 p-2 bg-red-500/20 hover:bg-red-500/50 text-red-500 hover:text-white rounded-full border border-red-500 transition-colors backdrop-blur-md"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="space-y-2 z-10">
            <label className="text-xs text-bot-cyan uppercase tracking-wider font-bold">Comando Neural (Prompt)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Adicione um filtro cyberpunk, remova o fundo, altere as cores para neon..."
              className="w-full bg-black/50 border border-bot-cyan/30 rounded-lg p-4 text-white focus:outline-none focus:border-bot-pink focus:shadow-neon-pink transition-all h-24 resize-none font-mono text-sm"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!originalImage || !prompt || isLoading}
            className={`w-full py-4 rounded-lg font-ethno tracking-wider flex items-center justify-center gap-2 transition-all duration-300 ${
              !originalImage || !prompt || isLoading
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                : 'bg-gradient-to-r from-bot-purple to-bot-pink text-white shadow-neon-purple hover:shadow-neon-pink hover:scale-[1.02]'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="animate-spin" /> PROCESSANDO...
              </>
            ) : (
              <>
                <Sparkles /> EXECUTAR ALTERAÇÃO
              </>
            )}
          </button>
          
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/50 text-red-400 text-xs font-mono rounded mt-2">
              ERRO: {error}
            </div>
          )}
        </div>

        {/* OUTPUT SECTION */}
        <div className="bg-bot-panel border border-bot-pink/20 rounded-xl p-6 flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-bot-pink/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <h3 className="text-xl font-ethno text-white flex items-center gap-2">
            <Sparkles size={20} className="text-bot-pink" /> OUTPUT
          </h3>

          <div className="flex-1 rounded-lg border border-bot-pink/30 bg-black/50 flex items-center justify-center relative overflow-hidden min-h-[300px]">
            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                 <div className="w-16 h-16 border-4 border-bot-pink border-t-transparent rounded-full animate-spin"></div>
                 <p className="font-ethno text-bot-pink animate-pulse">GERANDO REALIDADE...</p>
              </div>
            ) : generatedImage ? (
              <div className="relative w-full h-full group">
                <img src={generatedImage} alt="Generated" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                   <a 
                     href={generatedImage} 
                     download="autobotz_ai_generated.png"
                     className="bg-bot-pink text-white px-6 py-3 rounded-full font-ethno flex items-center gap-2 hover:bg-white hover:text-bot-pink transition-colors shadow-neon-pink"
                   >
                     <Download size={18} /> DOWNLOAD
                   </a>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 opacity-30">
                <div className="w-20 h-20 bg-gradient-to-br from-bot-purple to-bot-pink rounded-full blur-2xl mx-auto mb-4"></div>
                <p className="font-bank text-lg text-white">AGUARDANDO DADOS...</p>
              </div>
            )}
          </div>
          
          <div className="h-24 border border-white/5 rounded bg-white/5 p-4 flex items-center justify-center text-xs text-gray-500 font-mono text-center">
            {generatedImage 
              ? "RESULTADO GERADO PELO NÚCLEO GEMINI 2.5 FLASH." 
              : "O sistema está pronto para renderizar novas imagens baseadas em seus prompts."}
          </div>
        </div>

      </div>
    </div>
  );
};
