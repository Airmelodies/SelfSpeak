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
        profile: profile, // Save the profile to allow later language transfer
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

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this profile?")) {
      setHistory(prev => prev.filter(c => c.id !== id));
      if (activeCreation?.id === id) {
        setActiveCreation(null);
      }
    }
  };

  const handleImportHistory = (creation: Creation) => {
    setHistory(prev => {
      // Check if it already exists to avoid dupes visually 
      if (prev.some(c => c.id === creation.id)) {
        return prev;
      }
      return [creation, ...prev];
    });
    setActiveCreation(creation);
  };

  const handleReset = () => {
    // Exit profile and return to intake. History is auto-saved so no warning needed.
    setActiveCreation(null);
    setIsGenerating(false);
  };

  const handleTranslateProfile = (newLanguage: string) => {
    if (!activeCreation || !activeCreation.profile) {
      alert("Cannot translate this profile. The original profile data is missing.");
      return;
    }
    const updatedProfile = { ...activeCreation.profile, targetLanguage: newLanguage };
    handleGenerate(updatedProfile);
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
             <CreationHistory history={history} onSelect={handleSelectCreation} onDelete={handleDeleteHistory} onImport={handleImportHistory} />
          </div>
      </div>

      <LivePreview
        creation={activeCreation}
        isLoading={isGenerating}
        isFocused={isFocused}
        onReset={handleReset}
        onTranslate={handleTranslateProfile}
      />
    </div>
  );
};

export default App;