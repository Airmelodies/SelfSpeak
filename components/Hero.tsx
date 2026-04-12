/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { FingerPrintIcon, LanguageIcon, MicrophoneIcon } from '@heroicons/react/24/outline';

export const Hero: React.FC = () => {
  return (
    <div className="relative text-center max-w-5xl mx-auto px-4 pt-12 pb-8">
      {/* Abstract Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 mb-6">
          <FingerPrintIcon className="w-3 h-3 text-green-400" />
          <span className="tracking-widest uppercase">Identity Engine Active</span>
        </div>

        <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tighter text-white mb-6 leading-none">
          Self-Speak <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-green-400">System</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-light mb-8">
          Don't learn a language. <span className="text-zinc-200 font-medium">Learn YOUR language.</span> <br/>
          Achieve conversational fluency about your life, career, and passions in 30 days.
        </p>

        <div className="flex items-center justify-center gap-8 text-zinc-500 text-sm font-mono uppercase tracking-widest">
            <div className="flex items-center gap-2">
                <MicrophoneIcon className="w-4 h-4" />
                <span>Speak First</span>
            </div>
            <div className="w-1 h-1 bg-zinc-700 rounded-full"></div>
            <div className="flex items-center gap-2">
                <LanguageIcon className="w-4 h-4" />
                <span>Personalized</span>
            </div>
        </div>
      </div>
    </div>
  );
};