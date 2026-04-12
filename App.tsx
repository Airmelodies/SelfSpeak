/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { Hero } from './components/Hero';
import { InputArea } from './components/InputArea';
import { LivePreview } from './components/LivePreview';
import { CreationHistory, Creation } from './components/CreationHistory';
import { generateIdentityProfile, UserProfile } from './services/gemini';

const App: React.FC = () => {
  const [activeCreation, setActiveCreation] = useState<Creation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<Creation[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('self_speak_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
        })));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  useEffect(() => {
    if (history.length > 0) {
        localStorage.setItem('self_speak_history', JSON.stringify(history));
    }
  }, [history]);

  const handleGenerate = async (profile: UserProfile) => {
    setIsGenerating(true);
    setActiveCreation(null);

    try {
      const jsonString = await generateIdentityProfile(profile);
      const parsedData = JSON.parse(jsonString);

      const newCreation: Creation = {
        id: crypto.randomUUID(),
        name: parsedData.identityTitle || 'Identity Profile',
        html: jsonString,
        timestamp: new Date(),
      };
      
      setActiveCreation(newCreation);
      setHistory(prev => [newCreation, ...prev]);

    } catch (error) {
      console.error("Failed to generate:", error);
      alert("Could not generate your profile. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    const confirmReset = window.confirm(
      "⚠ EXIT PROFILE\n\nYou are about to leave your active identity profile. You can access it again later from your history.\n\nContinue?"
    );
    if (confirmReset) {
      setActiveCreation(null);
      setIsGenerating(false);
    }
  };

  const handleSelectCreation = (creation: Creation) => {
    setActiveCreation(creation);
  };

  const isFocused = !!activeCreation || isGenerating;

  return (
    <div className="h-[100dvh] bg-zinc-950 bg-dot-grid text-zinc-50 overflow-hidden relative flex flex-col font-sans">
      <div 
        className={`
          flex-1 flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10 
          transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)
          ${isFocused ? 'opacity-0 scale-95 blur-sm pointer-events-none' : 'opacity-100 scale-100 blur-0'}
        `}
      >
          <div className="w-full mb-8">
              <Hero />
          </div>

          <div className="w-full flex justify-center mb-8">
              <InputArea onGenerate={handleGenerate} isGenerating={isGenerating} disabled={isFocused} />
          </div>

          <div className="absolute bottom-8 w-full px-4">
             <CreationHistory history={history} onSelect={handleSelectCreation} />
          </div>
      </div>

      <LivePreview
        creation={activeCreation}
        isLoading={isGenerating}
        isFocused={isFocused}
        onReset={handleReset}
      />
    </div>
  );
};

export default App;