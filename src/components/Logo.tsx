import React from 'react';
import { cn } from '@/src/lib/utils';
import { motion } from 'framer-motion';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

export default function Logo({ className, showText = true, size = 'md', onClick }: LogoProps) {
  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
    xl: 'h-20 w-20'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  return (
    <div className={cn("flex items-center gap-2.5", className)} onClick={onClick}>
      <motion.div 
        whileHover={{ scale: 1.08, rotate: 5 }}
        whileTap={{ scale: 0.92, rotate: -5 }}
        className={cn(
          "relative flex items-center justify-center overflow-visible",
          sizeClasses[size]
        )}
      >
        {/* Glow Aura Background */}
        <div className="absolute inset-0 bg-primary/20 blur-[15px] rounded-full animate-pulse" />
        
        {/* Futuristic Shield */}
        <div className={cn(
          "relative w-full h-full bg-gradient-to-tr from-primary via-red-500 to-rose-500 rounded-xl shadow-2xl flex items-center justify-center",
          "before:content-[''] before:absolute before:inset-[2px] before:bg-white before:rounded-[10px] before:z-0",
          "after:content-[''] after:absolute after:inset-[2px] after:bg-gradient-to-tr after:from-primary/10 after:to-rose-500/10 after:rounded-[10px] after:z-10"
        )}>
          {/* Abstract GX Fusion Logo */}
          <svg 
            viewBox="0 0 100 100" 
            className="w-2/3 h-2/3 z-20 text-primary drop-shadow-md"
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* The "G" Path */}
            <motion.path
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              d="M75 30C70 20 55 15 40 20C20 28 15 50 25 70C35 90 60 90 75 80V55H50"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Light Flare/Sparkle */}
            <circle cx="75" cy="30" r="5" fill="#f43f5e" className="animate-ping" />
          </svg>

          {/* Floating Geometric Accents */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white shadow-sm z-30" 
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-red-400 rounded-sm border-2 border-white shadow-sm z-30" 
          />
        </div>

        {/* Glass Reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent rounded-xl z-30 pointer-events-none opacity-50" />
      </motion.div>
      
      {showText && (
        <div className="flex flex-col select-none">
          <span className={cn(
            "font-black tracking-tight leading-none bg-gradient-to-r from-gray-900 via-primary to-rose-600 bg-clip-text text-transparent italic",
            textSizes[size]
          )}>
            GlixBD
          </span>
          <div className="flex items-center gap-1">
            <span className="h-[1px] flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
            <span className="text-[10px] font-black text-primary/70 tracking-[0.3em] uppercase">
              Elite
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
