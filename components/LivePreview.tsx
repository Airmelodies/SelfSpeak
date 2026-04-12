/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { MicrophoneIcon, SpeakerWaveIcon, ArrowPathIcon, ShareIcon, BookOpenIcon, PlayIcon, StopIcon } from '@heroicons/react/24/solid';

interface LivePreviewProps {
  creation: any; // Using any for the JSON structure
  isLoading: boolean;
  isFocused: boolean;
  onReset: () => void;
}

const AudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Microphone access is needed to record your practice.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const playRecording = () => {
        if (audioBlob) {
            const url = URL.createObjectURL(audioBlob);
            const audio = new Audio(url);
            audio.play();
        }
    };

    return (
        <div className="flex items-center space-x-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
            <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}
            >
                {isRecording ? <StopIcon className="w-6 h-6 text-white" /> : <MicrophoneIcon className="w-6 h-6" />}
            </button>
            <div className="flex-1">
                <div className="text-sm font-medium text-white">{isRecording ? "Recording..." : audioBlob ? "Recording Saved" : "Record your script"}</div>
                <div className="text-xs text-zinc-500">{isRecording ? "Speak clearly..." : audioBlob ? "Click play to listen" : "Press the mic to start"}</div>
            </div>
            {audioBlob && !isRecording && (
                <button onClick={playRecording} className="p-2 text-blue-400 hover:text-blue-300">
                    <PlayIcon className="w-8 h-8" />
                </button>
            )}
        </div>
    );
};

export const LivePreview: React.FC<LivePreviewProps> = ({ creation, isLoading, isFocused, onReset }) => {
    const [activeTab, setActiveTab] = useState<'script' | 'vocab'>('script');
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1.0);

    useEffect(() => {
        const updateVoices = () => {
            const available = window.speechSynthesis.getVoices();
            if (available.length > 0) {
                setVoices(available);
            }
        };
        updateVoices();
        window.speechSynthesis.onvoiceschanged = updateVoices;
        return () => { window.speechSynthesis.onvoiceschanged = null; };
    }, []);

    const data = useMemo(() => {
        if (!creation || !creation.html) return null;
        try {
            return JSON.parse(creation.html);
        } catch (e) {
            console.error("Failed to parse creation JSON", e);
            return null;
        }
    }, [creation]);

    const segments = useMemo(() => {
        if (data?.scriptSegments) return data.scriptSegments;
        return [];
    }, [data]);

    const hasTransliteration = useMemo(() => {
        return segments.some((s: any) => s.transliteration && s.transliteration.trim() !== '');
    }, [segments]);

    const getVoiceForLanguage = useCallback((langName: string, genderPreference?: 'Male' | 'Female') => {
        if (!voices.length) return null;
        const normalized = langName.toLowerCase();
        let code = 'en'; 
        if (normalized.includes('spanish') || normalized.includes('español')) code = 'es';
        else if (normalized.includes('french') || normalized.includes('français')) code = 'fr';
        else if (normalized.includes('german') || normalized.includes('deutsch')) code = 'de';
        else if (normalized.includes('italian') || normalized.includes('italiano')) code = 'it';
        else if (normalized.includes('japanese') || normalized.includes('nihongo')) code = 'ja';
        else if (normalized.includes('chinese') || normalized.includes('mandarin')) code = 'zh';
        else if (normalized.includes('portuguese') || normalized.includes('português')) code = 'pt';
        else if (normalized.includes('russian')) code = 'ru';
        else if (normalized.includes('korean')) code = 'ko';
        else if (normalized.includes('amharic')) code = 'am'; 
        
        const langVoices = voices.filter(v => v.lang.startsWith(code));
        const maleKeywords = ['male', 'david', 'mark', 'paul', 'ichiro', 'guy', 'daniel', 'stefan', 'pavel', 'george', 'thomas', 'henri', 'diego', 'marco', 'keita', 'yun', 'andrew', 'james', 'robert'];
        const femaleKeywords = ['female', 'zira', 'hazel', 'aria', 'elena', 'laura', 'anna', 'nanami', 'sandra', 'shiori', 'martha', 'sophie', 'lucia', 'haruka', 'min', 'lisa', 'sarah', 'mary'];

        const isVoiceMale = (name: string) => maleKeywords.some(k => name.toLowerCase().includes(k));
        const isVoiceFemale = (name: string) => femaleKeywords.some(k => name.toLowerCase().includes(k));

        let genderFiltered = langVoices;
        if (genderPreference) {
            const isPrefMale = genderPreference === 'Male';
            const matchesGender = langVoices.filter(v => isPrefMale ? isVoiceMale(v.name) : isVoiceFemale(v.name));
            if (matchesGender.length > 0) genderFiltered = matchesGender;
        }
        return genderFiltered[0] || langVoices[0];
    }, [voices]);

    const handleSpeakWhole = () => {
        if ('speechSynthesis' in window) {
            if (isPlaying) {
                window.speechSynthesis.cancel();
                setIsPlaying(false);
                return;
            }
            if (segments.length > 0) {
                window.speechSynthesis.cancel();
                const fullText = segments.map((s: any) => s.target).join(' ');
                const utterance = new SpeechSynthesisUtterance(fullText);
                const voice = getVoiceForLanguage(data.targetLanguage, data.gender);
                if (voice) utterance.voice = voice;
                utterance.rate = playbackRate;
                utterance.onend = () => setIsPlaying(false);
                utterance.onerror = () => setIsPlaying(false);
                window.speechSynthesis.speak(utterance);
                setIsPlaying(true);
            }
        }
    };

    const handleSpeakWord = (textToSpeak: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            const voice = getVoiceForLanguage(data.targetLanguage, data.gender);
            if (voice) utterance.voice = voice;
            utterance.rate = playbackRate;
            window.speechSynthesis.speak(utterance);
        }
    };

    if (isLoading) {
        return (
            <div className={`fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 transition-opacity duration-500 ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                 <div className="text-center space-y-6">
                    <div className="w-16 h-16 mx-auto border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white">Synthesizing Identity Profile</h3>
                        <p className="text-zinc-500 font-mono text-sm">Merging common lexicon with personal data...</p>
                    </div>
                 </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className={`fixed z-40 inset-0 md:inset-4 bg-[#09090b] md:rounded-2xl overflow-hidden flex flex-col transition-all duration-700 ${isFocused ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
                <div className="flex items-center space-x-4">
                    <button onClick={onReset} className="p-2 -ml-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors" title="Exit Profile">
                        <ArrowPathIcon className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-white leading-tight">{data.identityTitle}</h2>
                        <p className="text-xs font-mono text-blue-400 uppercase tracking-wider">{data.targetLanguage} • {data.gender} Identity</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="hidden sm:flex items-center bg-zinc-800 rounded-full px-3 py-1 gap-2 text-[10px] font-mono text-zinc-400">
                        <BookOpenIcon className="w-3 h-3 text-green-500" />
                        <span>{data.vocabulary.length} TERMS PULLED</span>
                    </div>
                    <button className="flex items-center space-x-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium text-white transition-colors">
                        <ShareIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Export Profile</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                <div className="w-full md:w-64 bg-zinc-900/30 border-r border-zinc-800 p-4 flex flex-row md:flex-col gap-2 shrink-0 overflow-x-auto md:overflow-visible">
                    <button 
                        onClick={() => setActiveTab('script')}
                        className={`group flex items-center justify-between w-full p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'script' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-zinc-400 hover:bg-zinc-800'}`}
                    >
                        <div className="flex items-center space-x-3">
                            <SpeakerWaveIcon className="w-5 h-5" />
                            <span>Identity Script</span>
                        </div>
                    </button>
                    <button 
                        onClick={() => setActiveTab('vocab')}
                        className={`group flex items-center justify-between w-full p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'vocab' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-zinc-400 hover:bg-zinc-800'}`}
                    >
                        <div className="flex items-center space-x-3">
                            <BookOpenIcon className="w-5 h-5" />
                            <span>Vocabulary</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] transition-colors ${activeTab === 'vocab' ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700'}`}>
                            {data.vocabulary.length}
                        </span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-dot-grid">
                    <div className="max-w-6xl mx-auto space-y-8">
                        {activeTab === 'script' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                        <SpeakerWaveIcon className="w-48 h-48" />
                                    </div>
                                    <div className="relative z-10 space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-zinc-500 text-sm font-mono uppercase tracking-wider">Living Narrative</h3>
                                                {hasTransliteration && (
                                                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-500/20">
                                                        Phonetic Reading Mode
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xl md:text-2xl font-medium leading-relaxed text-zinc-100 select-none">
                                                {segments.map((seg: any, i: number) => (
                                                    <React.Fragment key={i}>
                                                        <span 
                                                            onClick={() => setHighlightedIndex(i)}
                                                            onDoubleClick={() => handleSpeakWord(seg.target)}
                                                            className={`cursor-pointer transition-all duration-200 rounded px-1 -mx-1 inline-block ${
                                                                highlightedIndex === i 
                                                                    ? 'bg-blue-500/30 text-blue-100' 
                                                                    : 'hover:bg-white/10'
                                                            }`}
                                                        >
                                                            {hasTransliteration ? (seg.transliteration || seg.target) : seg.target}
                                                        </span>
                                                        {i < segments.length - 1 && ' '}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <button onClick={handleSpeakWhole} className={`inline-flex items-center space-x-2 text-sm font-medium transition-colors ${isPlaying ? 'text-red-400' : 'text-blue-400'}`}>
                                                    {isPlaying ? <StopIcon className="w-4 h-4" /> : <SpeakerWaveIcon className="w-4 h-4" />}
                                                    <span>{isPlaying ? 'Stop' : 'Listen to story'}</span>
                                                </button>
                                                <div className="flex items-center bg-zinc-800 rounded-full px-2 py-1 gap-1 border border-zinc-700">
                                                    {[0.75, 1.0, 1.25].map(rate => (
                                                        <button key={rate} onClick={() => setPlaybackRate(rate)} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${playbackRate === rate ? 'bg-blue-500 text-white' : 'text-zinc-500'}`}>{rate}x</button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-px bg-zinc-800 w-full"></div>
                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div>
                                                <h4 className="text-zinc-500 text-xs font-mono uppercase mb-3">{hasTransliteration ? "Script" : "Phonetic"}</h4>
                                                <div className="text-zinc-400 font-light text-lg leading-relaxed italic">
                                                    {segments.map((seg: any, i: number) => (
                                                        <span key={i} className={`px-1 -mx-1 ${highlightedIndex === i ? 'text-blue-300 font-bold' : ''}`}>
                                                            {hasTransliteration ? seg.target : seg.phonetic}{' '}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-zinc-500 text-xs font-mono uppercase mb-3">Translation</h4>
                                                <div className="text-zinc-400 font-light text-lg leading-relaxed">
                                                    {segments.map((seg: any, i: number) => (
                                                        <span key={i} className={`px-1 -mx-1 ${highlightedIndex === i ? 'text-green-300' : ''}`}>
                                                            {seg.native}{' '}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8"><AudioRecorder /></div>
                            </div>
                        )}
                        {activeTab === 'vocab' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {data.vocabulary.map((item: any, idx: number) => (
                                    <div key={idx} onDoubleClick={() => handleSpeakWord(item.term)} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between group hover:border-blue-500/50 transition-all cursor-pointer select-none">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">{item.type}</span>
                                            <p className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{item.term}</p>
                                            {item.transliteration && <p className="text-xs font-mono text-zinc-500 italic">{item.transliteration}</p>}
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-zinc-800/50"><p className="text-sm text-zinc-400 font-medium">{item.native}</p></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};