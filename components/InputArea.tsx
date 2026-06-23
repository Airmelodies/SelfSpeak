/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRightIcon, 
  ArrowLeftIcon, 
  SparklesIcon, 
  ArrowPathIcon 
} from '@heroicons/react/24/outline';
import { 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon 
} from '@heroicons/react/24/solid';
import { UserProfile } from '../services/gemini';

interface InputAreaProps {
  onGenerate: (profile: UserProfile) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

const STEPS = [
  { id: 'gender', question: "Select your voice identity", type: 'select', options: ['Male', 'Female'] },
  { id: 'name', question: "What is your name?", placeholder: "e.g., Alex, Yuki, Sarah" },
  { id: 'targetLanguage', question: "Which language do you want to embody?", type: 'select', options: ['Spanish', 'Japanese', 'Portuguese', 'Italian', 'French'] },
  { id: 'profession', question: "What is your work or calling?", placeholder: "e.g., UX Designer, Nurse, Student" },
  { id: 'passion', question: "What are you obsessed with?", placeholder: "e.g., Indie Rock, Hiking, Cooking Pasta" },
  { id: 'travel', question: "Describe a travel memory or dream destination.", placeholder: "e.g., Hiking in Patagonia, Cafe in Paris" },
  { id: 'family', question: "Tell us about your family or household.", placeholder: "e.g., Live with partner and cat, Close to my sister" },
  { id: 'routine', question: "What is a specific habit you do every day?", placeholder: "e.g., Make pour-over coffee, Walk the dog at 6am" },
  { id: 'environment', question: "Describe your living space or city.", placeholder: "e.g., Small apartment in NYC, Quiet house with a garden" },
  { id: 'diet', question: "What do you eat or drink most often?", placeholder: "e.g., Sushi, Black tea, Avocados, Spicy Curry" },
  { id: 'essentials', question: "What 3 objects do you use daily?", placeholder: "e.g., Laptop, Sketchbook, Chef's Knife" },
  { id: 'goals', question: "What is a major goal you are working towards?", placeholder: "e.g., Run a marathon, Launch a business" },
  { id: 'stories', question: "Share a unique quirk or story about yourself.", placeholder: "e.g., I collect vintage spoons, I once met a bear" },
  { id: 'motivation', question: "Why learn this language now?", placeholder: "e.g., To speak with my grandmother, Travel to Tokyo" },
  { id: 'personality', question: "Describe your vibe in 3 words.", placeholder: "e.g., Energetic, Curious, Calm" }
];

const VIBE_MP3_PATH = 'vibe.mp3'; // Fallback to relative path which often resolves better if public path is weird M3 path
const TARGET_VOLUME = 0.25; // Default volume at 25%

export const InputArea: React.FC<InputAreaProps> = ({ onGenerate, isGenerating, disabled = false }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [isFocused, setIsFocused] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.src = VIBE_MP3_PATH;
    audio.loop = true;
    audio.volume = 0;
    audio.preload = 'auto';
    
    audio.onerror = () => {
      console.warn("Vibe MP3 loading failed at root.");
      setAudioError(true);
    };

    audioRef.current = audio;

    return () => {
      if (fadeIntervalRef.current) window.clearInterval(fadeIntervalRef.current);
      audio.pause();
      audio.src = '';
    };
  }, []);

  const fadeInAudio = () => {
    if (fadeIntervalRef.current) window.clearInterval(fadeIntervalRef.current);
    if (!audioRef.current || audioError) return;

    const audio = audioRef.current;
    try {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn("Audio play failed:", err);
          setAudioError(true);
        });
      }
    } catch (err) {
      console.warn("Audio play synchronous error:", err);
      setAudioError(true);
    }
    
    let vol = audio.volume;
    fadeIntervalRef.current = window.setInterval(() => {
      if (vol < TARGET_VOLUME) {
        vol += 0.01;
        audio.volume = Math.min(vol, TARGET_VOLUME);
      } else {
        if (fadeIntervalRef.current) window.clearInterval(fadeIntervalRef.current);
      }
    }, 50);
  };

  const fadeOutAudio = () => {
    if (fadeIntervalRef.current) window.clearInterval(fadeIntervalRef.current);
    if (!audioRef.current) return;

    const audio = audioRef.current;
    let vol = audio.volume;
    fadeIntervalRef.current = window.setInterval(() => {
      if (vol > 0.01) {
        vol -= 0.01;
        audio.volume = Math.max(vol, 0);
      } else {
        audio.pause();
        audio.volume = 0;
        if (fadeIntervalRef.current) window.clearInterval(fadeIntervalRef.current);
      }
    }, 50);
  };

  const startAudioIfFirstInteraction = () => {
    if (currentStep === 0 && !isMusicPlaying && !audioError) {
      setIsMusicPlaying(true);
      fadeInAudio();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, [STEPS[currentStep].id]: val }));
    startAudioIfFirstInteraction();
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, [STEPS[currentStep].id]: value }));
    startAudioIfFirstInteraction();
    
    // Auto-advance for select inputs to improve UX correctly outside of the state updater
    setTimeout(() => {
      setCurrentStep(prevStep => {
        if (prevStep < STEPS.length - 1) {
          return prevStep + 1;
        } else {
          // Fallback if they were on the last step (though gender is step 0)
          return prevStep; 
        }
      });
    }, 350);
  };

  const handleNext = () => {
    if (!formData[STEPS[currentStep].id]) return;
    
    // Auto-start ambiance on first interaction (fallback if they just clicked next)
    startAudioIfFirstInteraction();

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onGenerate(formData as UserProfile);
      setIsMusicPlaying(false);
      fadeOutAudio();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleResetTrigger = () => {
    const confirmReset = window.confirm(
      "⚠ WARNING: ABORT DATA ENTRY\n\nThis will permanently erase all information you've entered for this identity profile. Are you sure you want to reset?"
    );
    if (confirmReset) {
      setFormData({});
      setCurrentStep(0);
      setIsMusicPlaying(false);
      fadeOutAudio();
    }
  };

  const toggleVibe = () => {
    if (audioError) {
      // Gracefully do nothing if audio is broken
      return;
    }
    if (isMusicPlaying) {
      setIsMusicPlaying(false);
      fadeOutAudio();
    } else {
      setIsMusicPlaying(true);
      fadeInAudio();
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const currentStepData = STEPS[currentStep];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        className={`
          relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 md:p-12
          transition-all duration-500
          ${isFocused ? 'ring-2 ring-blue-500/20 border-blue-500/50 shadow-2xl shadow-blue-500/10' : 'hover:border-zinc-700'}
        `}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800 rounded-t-2xl overflow-hidden">
            <div 
                className="h-full bg-gradient-to-r from-blue-500 to-green-400 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
            ></div>
        </div>

        <div className="mb-8 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            <div className="flex items-center space-x-2">
              <span className="text-zinc-400 shrink-0">Sequence {currentStep + 1}/{STEPS.length}</span>
              {currentStep > 0 && (
                <button 
                  type="button"
                  onClick={handleResetTrigger}
                  className="ml-4 flex items-center space-x-1 text-zinc-600 hover:text-red-500 transition-colors"
                  title="Reset all fields"
                >
                  <ArrowPathIcon className="w-3 h-3" />
                  <span>Abort Sequence</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                type="button"
                onClick={toggleVibe}
                className={`flex items-center space-x-2 transition-all duration-300 ${isMusicPlaying ? 'text-blue-400' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                <div className="relative">
                  {isMusicPlaying ? (
                    <>
                      <SpeakerWaveIcon className="w-4 h-4 animate-pulse" />
                      <div className="absolute inset-0 bg-blue-500/20 blur-sm animate-pulse rounded-full"></div>
                    </>
                  ) : (
                    <SpeakerXMarkIcon className="w-4 h-4" />
                  )}
                </div>
                <span className="hidden sm:inline font-bold">
                  {audioError ? 'Ambiance Unavailable' : isMusicPlaying ? `Ambiance ${Math.round(TARGET_VOLUME * 100)}%` : 'Ambiance Off'}
                </span>
              </button>
              <span className="text-zinc-800">|</span>
              <span className="text-zinc-600">Secure Intake</span>
            </div>
        </div>

        <div className="min-h-[160px] flex flex-col justify-center">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 animate-in fade-in slide-in-from-left-4 duration-500" key={currentStepData.question}>
                {currentStepData.question}
            </h3>

            <div className="relative">
                {currentStepData.type === 'select' ? (
                  <div className="flex gap-4 flex-wrap">
                    {currentStepData.options?.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectChange(opt)}
                        className={`
                          px-6 py-3 rounded-xl border-2 text-lg font-medium transition-all duration-300
                          ${formData[currentStepData.id] === opt 
                            ? 'border-blue-500 bg-blue-500/10 text-white shadow-[0_0_30px_rgba(59,130,246,0.1)]' 
                            : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'}
                        `}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                      type="text"
                      value={formData[currentStepData.id] || ''}
                      onChange={handleInputChange}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleNext(); }}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder={currentStepData.placeholder}
                      className="w-full bg-transparent border-b-2 border-zinc-800 text-xl md:text-2xl text-white pb-4 placeholder-zinc-700 focus:outline-none focus:border-blue-500 transition-all duration-300"
                      disabled={isGenerating || disabled}
                  />
                )}
            </div>
        </div>

        <div className="mt-10 flex justify-between items-center">
            <div>
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isGenerating}
                  className="group flex items-center space-x-2 px-6 py-3 rounded-full font-medium text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all duration-300"
                >
                  <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  <span>Previous</span>
                </button>
              )}
            </div>
            
            <button
                type="button"
                onPointerDown={(e) => { e.preventDefault(); handleNext(); }}
                disabled={!formData[currentStepData.id] || isGenerating}
                className={`
                    group flex items-center space-x-2 px-8 py-3 rounded-full font-bold transition-all duration-500
                    ${!formData[currentStepData.id] 
                        ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50' 
                        : 'bg-white text-black hover:scale-105 active:scale-95 shadow-xl shadow-white/5'}
                `}
            >
                <span>{currentStep === STEPS.length - 1 ? (isGenerating ? 'Synthesizing...' : 'Finalize Profile') : 'Continue'}</span>
                {isGenerating ? (
                    <SparklesIcon className="w-5 h-5 animate-spin" />
                ) : (
                    <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                )}
            </button>
        </div>
      </div>
    </div>
  );
};