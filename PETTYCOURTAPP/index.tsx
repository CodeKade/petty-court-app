import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Type } from "@google/genai";
import { Gavel, Scale, Share2, Lock, RotateCcw, X, ShieldAlert, Globe, Flame, Zap, ToggleLeft, ToggleRight, User, UserX } from "lucide-react";

// --- Types ---

interface Verdict {
  winner: string;
  sentence: string;
  roast: string;
  detailed_verdict: string;
}

// --- Constants & Config ---

const DAILY_LIMIT = 3;
const STORAGE_KEY_COUNT = "petty_court_count";
const STORAGE_KEY_TIME = "petty_court_last_reset";

// --- Components ---

const LoadingScreen = ({ message, isNigerianMode }: { message: string, isNigerianMode: boolean }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 bg-opacity-95 backdrop-blur-sm p-6 text-center">
    {isNigerianMode ? (
      <div className="text-6xl mb-8 animate-bounce">🩴</div>
    ) : (
      <Gavel className="w-20 h-20 text-amber-500 mb-8 gavel-animation" />
    )}
    <h2 className="text-3xl font-bold text-amber-100 mb-4 judicial-font tracking-wide">
      {isNigerianMode ? "Mummy is Coming..." : "Court is in Session"}
    </h2>
    <p className="text-amber-500/80 text-xl animate-pulse font-medium">{message}</p>
  </div>
);

const Footer = () => (
  <footer className="w-full text-center py-8 mt-4 border-t border-slate-900">
    <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">Built for the Petty.</p>
    <a 
      href="mailto:alukokenny386@gmail.com?subject=Petty Court Feedback" 
      className="text-slate-700 text-xs hover:text-amber-500 transition-colors underline decoration-slate-800 underline-offset-4"
    >
      Found a bug? Tell us.
    </a>
  </footer>
);

const ShareModal = ({ 
  isOpen, 
  onUnlock, 
  onClose,
  isNigerianMode
}: { 
  isOpen: boolean; 
  onUnlock: () => void;
  onClose: () => void;
  isNigerianMode: boolean;
}) => {
  if (!isOpen) return null;

  const handleShare = async () => {
    const text = isNigerianMode 
      ? 'My village people have followed me to Petty Court. Come and see my judgment! 🇳🇬' 
      : 'I just got roasted by the Petty Court AI. Come get judged!';
    const url = window.location.href;

    try {
      let shared = false;
      
      // 1. Try Native Share first
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({
            title: 'Petty Court',
            text: text,
            url: url,
          });
          shared = true;
        } catch (shareError) {
          console.log("Native share cancelled or failed, trying clipboard:", shareError);
          // Fall through to clipboard
        }
      }

      // 2. Fallback to Clipboard if share didn't happen
      if (!shared) {
        try {
          await navigator.clipboard.writeText(url);
          // 3. Feedback for clipboard success
          alert("Link copied! Court unlocked.");
        } catch (clipboardError) {
          console.warn("Clipboard access denied or failed:", clipboardError);
          // 4. Fallback feedback if even clipboard fails
          // Just let them in so the app isn't broken for them
          alert("Court unlocked!");
        }
      }
    } catch (error) {
      console.error("Critical share process failed:", error);
      // Failsafe alert
      alert("Court unlocked!");
    } finally {
      // 5. The Unlock - GUARANTEED to run
      onUnlock();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-slate-900 border-2 border-amber-600 rounded-2xl max-w-sm w-full p-8 shadow-2xl transform transition-all scale-100">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-900/30 flex items-center justify-center border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Lock className="w-8 h-8 text-amber-500" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-3xl font-black text-white judicial-font tracking-tight">
              COURT ADJOURNED 🔒
            </h3>
            <p className="text-slate-300 text-base leading-relaxed">
              {isNigerianMode 
                ? "Haba! You don reach your daily limit of 3 cases. Mummy is tired." 
                : `You have reached your daily limit of ${DAILY_LIMIT} verdicts. The Judge needs a nap.`}
            </p>
          </div>
          
          <div className="bg-slate-800 p-5 rounded-xl w-full border border-slate-700 shadow-inner">
            <p className="text-amber-400 font-bold mb-1 text-lg">
              {isNigerianMode ? "Beg Mummy" : "Bribe the Court"}
            </p>
            <p className="text-sm text-slate-400">Share Petty Court to unlock 3 more verdicts immediately.</p>
          </div>

          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform active:scale-95 shadow-[0_0_20px_rgba(22,163,74,0.3)] text-lg cursor-pointer"
          >
            <Share2 className="w-5 h-5" />
            Share to Unlock
          </button>
        </div>
      </div>
    </div>
  );
};

const VerdictCard = ({ verdict, onReset, isNigerianMode }: { verdict: Verdict; onReset: () => void; isNigerianMode: boolean }) => {
  const isPlaintiffWinner = verdict.winner.toLowerCase().includes("plaintiff");
  
  // Stamp Color Logic
  const stampColor = isPlaintiffWinner ? "text-blue-500 border-blue-500" : "text-red-500 border-red-500";
  const stampShadow = isPlaintiffWinner ? "shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "shadow-[0_0_15px_rgba(239,68,68,0.3)]";

  useEffect(() => {
    // School Pride Confetti
    let isActive = true;

    const runConfetti = async () => {
      try {
        const confettiModule = await import("canvas-confetti");
        const confetti = confettiModule.default;
        
        if (!isActive || typeof confetti !== 'function') return;

        const end = Date.now() + 1000;
        const colors = isPlaintiffWinner ? ['#3b82f6', '#ffffff'] : ['#ef4444', '#ffffff'];

        (function frame() {
          if (!isActive) return;
          confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
          });
          confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());
      } catch (e) {
        console.error("Confetti failed to load", e);
      }
    };

    runConfetti();
    return () => { isActive = false; };
  }, [isPlaintiffWinner]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in-up pb-20">
      {/* The Decree */}
      <div className="relative bg-[#f4e4bc] text-slate-900 p-8 rounded-sm shadow-2xl border-4 border-slate-900 verdict-texture">
        {/* Paper Texture Overlay handled by CSS class verdict-texture */}
        
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Scale className="w-8 h-8 text-slate-800" />
            <h2 className="text-3xl font-bold judicial-font tracking-tighter uppercase">Official Decree</h2>
          </div>
          <div className="text-xs font-mono border border-slate-900 px-2 py-1 rounded">
            CASE #{Math.floor(Math.random() * 9000) + 1000}
          </div>
        </div>

        {/* Winner Section */}
        <div className="mb-8 text-center relative">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-600 mb-2">Judgment Rendered In Favor Of</p>
          <h3 className={`text-4xl font-black uppercase ${isPlaintiffWinner ? 'text-blue-900' : 'text-red-900'} judicial-font`}>
            {verdict.winner}
          </h3>
          
          {/* Stamp Effect */}
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12 border-4 ${stampColor} ${stampShadow} p-2 rounded-lg opacity-80 pointer-events-none`}>
            <span className={`text-xl font-black uppercase stamp-font ${stampColor.split(' ')[0]}`}>
              {verdict.winner === 'Plaintiff' ? 'GRANTED' : 'DENIED'}
            </span>
          </div>
        </div>

        {/* The Sentence */}
        <div className="bg-slate-900/5 p-4 rounded-lg mb-6 border-l-4 border-amber-600">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-sm mb-1 flex items-center gap-2">
            <Gavel className="w-4 h-4" />
            The Sentence
          </h4>
          <p className="text-lg font-serif italic leading-relaxed">
            "{verdict.sentence}"
          </p>
        </div>

        {/* The Roast */}
        <div className="mb-6">
           <h4 className="font-bold text-slate-900 uppercase tracking-wider text-sm mb-2 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-600" />
            The Roast
          </h4>
          <p className="text-slate-800 leading-relaxed font-medium">
            {verdict.roast}
          </p>
        </div>

         {/* Detailed Verdict */}
         <div className="mb-6 text-sm text-slate-700 border-t border-slate-900/20 pt-4">
          <p className="leading-relaxed">
            {verdict.detailed_verdict}
          </p>
        </div>

        {/* Signature */}
        <div className="flex justify-end mt-8 pt-4">
          <div className="text-center">
            <div className="font-script text-2xl text-slate-800 transform -rotate-6 mb-1">
              {isNigerianMode ? "Mummy" : "Hon. Judge GPT"}
            </div>
            <div className="w-32 h-0.5 bg-slate-900"></div>
            <div className="text-[10px] font-bold uppercase mt-1 tracking-widest text-slate-500">Presiding Judge</div>
          </div>
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg border border-slate-700"
      >
        <RotateCcw className="w-5 h-5" />
        New Case
      </button>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [isNigerianMode, setIsNigerianMode] = useState(false);
  const [plaintiffInput, setPlaintiffInput] = useState("");
  const [defendantInput, setDefendantInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [verdictCount, setVerdictCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load state from local storage on mount
  useEffect(() => {
    const savedCount = localStorage.getItem(STORAGE_KEY_COUNT);
    const lastReset = localStorage.getItem(STORAGE_KEY_TIME);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (savedCount && lastReset) {
      if (now - parseInt(lastReset) > oneDay) {
        // Reset if more than 24 hours
        localStorage.setItem(STORAGE_KEY_COUNT, "0");
        localStorage.setItem(STORAGE_KEY_TIME, now.toString());
        setVerdictCount(0);
      } else {
        setVerdictCount(parseInt(savedCount));
      }
    } else {
      // First time init
      localStorage.setItem(STORAGE_KEY_TIME, now.toString());
    }
  }, []);

  const handleJudge = async () => {
    if (!plaintiffInput.trim() || !defendantInput.trim()) {
      alert("Both sides must present their case!");
      return;
    }

    // THE BLOCK: Daily Limit Check
    // Critical: This MUST happen before the API call
    if (verdictCount >= DAILY_LIMIT) {
      setIsModalOpen(true);
      return; // Stop execution immediately
    }

    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemPrompt = isNigerianMode
        ? `You are a strict, no-nonsense Nigerian mother acting as a judge. Use Nigerian English (Pidgin nuances permitted but keep it readable). Be harsh, funny, and refer to "Village People". Do not be neutral. Pick a winner definitively.`
        : `You are Judge GPT. A sarcastic, witty, and slightly mean petty court judge. You have no patience for stupidity. Be funny, roast both sides, but deliver a clear, binding verdict.`;

      const prompt = `
        ${systemPrompt}
        
        Plaintiff's Case: "${plaintiffInput}"
        Defendant's Case: "${defendantInput}"
        
        Analyze this petty argument.
        Return ONLY a JSON object with this exact schema (no markdown formatting):
        {
          "winner": "Plaintiff" or "Defendant",
          "sentence": "A short, sarcastic punishment for the loser",
          "roast": "A specific roast targeting the loser's stupidity",
          "detailed_verdict": "Your logic for the decision (2-3 sentences)"
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              winner: { type: Type.STRING },
              sentence: { type: Type.STRING },
              roast: { type: Type.STRING },
              detailed_verdict: { type: Type.STRING },
            },
            required: ["winner", "sentence", "roast", "detailed_verdict"]
          }
        }
      });

      const jsonText = response.text;
      const result = JSON.parse(jsonText) as Verdict;

      setVerdict(result);
      
      // Increment Count
      const newCount = verdictCount + 1;
      setVerdictCount(newCount);
      localStorage.setItem(STORAGE_KEY_COUNT, newCount.toString());

    } catch (error) {
      console.error("Judgment failed:", error);
      alert(`Judgment failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const unlockVerdicts = () => {
    setVerdictCount(0);
    localStorage.setItem(STORAGE_KEY_COUNT, "0");
    setIsModalOpen(false);
  };

  const resetCourt = () => {
    setVerdict(null);
    setPlaintiffInput("");
    setDefendantInput("");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans bg-noise selection:bg-amber-500/30">
      {isLoading && (
        <LoadingScreen 
          isNigerianMode={isNigerianMode}
          message={isNigerianMode ? "Consulting the Elders..." : "Polishing the Gavel..."} 
        />
      )}
      
      <ShareModal 
        isOpen={isModalOpen} 
        onUnlock={unlockVerdicts} 
        onClose={() => setIsModalOpen(false)}
        isNigerianMode={isNigerianMode}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2 text-amber-500">
          <Gavel className="w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight judicial-font text-amber-50">Petty Court</h1>
        </div>
        
        {/* Toggle Switch */}
        <button 
          onClick={() => setIsNigerianMode(!isNigerianMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
            isNigerianMode 
              ? "bg-green-900/40 border-green-500 text-green-400" 
              : "bg-slate-900 border-slate-700 text-slate-400"
          }`}
        >
          {isNigerianMode ? <Globe className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
          <span className="text-xs font-bold uppercase tracking-wider">
            {isNigerianMode ? "Naija Mode" : "Standard"}
          </span>
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 w-full max-w-md mx-auto p-4 flex flex-col">
        {!verdict ? (
          <div className="space-y-6 flex-1 flex flex-col justify-center animate-fade-in">
            <div className="text-center space-y-2 mb-4">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 border border-slate-800 mb-2 shadow-inner">
                  <Scale className="w-8 h-8 text-amber-600" />
               </div>
               <h2 className="text-2xl font-bold text-white judicial-font">
                 {isNigerianMode ? "Oya, Talk True" : "State Your Case"}
               </h2>
               <p className="text-slate-400 text-sm">
                 {isNigerianMode ? "Who is mad? Tell me now." : "The Judge is ready. Keep it brief."}
               </p>
            </div>

            <div className="space-y-4">
              {/* Plaintiff Input */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl opacity-20 group-focus-within:opacity-100 transition duration-500 blur-sm"></div>
                <div className="relative bg-slate-900 rounded-xl p-1">
                   <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800">
                      <User className="w-4 h-4 text-blue-400" />
                      <label className="text-xs font-bold uppercase tracking-wider text-blue-400">Plaintiff (Side A)</label>
                   </div>
                   <textarea
                    value={plaintiffInput}
                    onChange={(e) => setPlaintiffInput(e.target.value)}
                    placeholder={isNigerianMode ? "He did not return my Tupperware..." : "He ate my leftovers..."}
                    className="w-full bg-slate-900 text-white p-3 rounded-b-xl focus:outline-none min-h-[100px] resize-none placeholder-slate-600"
                  />
                </div>
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                 <div className="bg-slate-950 rounded-full p-2 border border-slate-800 text-slate-500 text-xs font-bold">VS</div>
              </div>

              {/* Defendant Input */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-red-600 rounded-xl opacity-20 group-focus-within:opacity-100 transition duration-500 blur-sm"></div>
                <div className="relative bg-slate-900 rounded-xl p-1">
                   <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800">
                      <UserX className="w-4 h-4 text-red-400" />
                      <label className="text-xs font-bold uppercase tracking-wider text-red-400">Defendant (Side B)</label>
                   </div>
                   <textarea
                    value={defendantInput}
                    onChange={(e) => setDefendantInput(e.target.value)}
                    placeholder={isNigerianMode ? "It was just small rice..." : "It had no name on it..."}
                    className="w-full bg-slate-900 text-white p-3 rounded-b-xl focus:outline-none min-h-[100px] resize-none placeholder-slate-600"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 mb-4">
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-xs text-slate-500 font-mono">DAILY LIMIT</span>
                <span className="text-xs font-bold text-amber-500 font-mono">{DAILY_LIMIT - verdictCount} REMAINING</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-amber-600 h-full transition-all duration-500 ease-out" 
                  style={{ width: `${((DAILY_LIMIT - verdictCount) / DAILY_LIMIT) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <button
              onClick={handleJudge}
              className="w-full relative group overflow-hidden bg-amber-600 hover:bg-amber-500 text-white font-black py-5 px-6 rounded-xl shadow-[0_0_20px_rgba(217,119,6,0.3)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <div className="flex items-center justify-center gap-3 relative z-10">
                <Gavel className="w-6 h-6" />
                <span className="text-lg tracking-wide uppercase judicial-font">
                   {isNigerianMode ? "Judge Am Now!" : "Enter Court"}
                </span>
              </div>
            </button>
          </div>
        ) : (
          <VerdictCard verdict={verdict} onReset={resetCourt} isNigerianMode={isNigerianMode} />
        )}
      </div>

      <Footer />
    </main>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);