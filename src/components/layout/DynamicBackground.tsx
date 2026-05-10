import React from 'react';
import { motion } from 'framer-motion';

const Cloud = ({ delay, duration, top, scale }: { delay: number, duration: number, top: string, scale: number }) => (
  <motion.div
    initial={{ x: '-40%', opacity: 0 }}
    animate={{ 
      x: '140%', 
      opacity: [0, 1, 1, 0] 
    }}
    transition={{ 
      duration, 
      repeat: Infinity, 
      delay,
      ease: "linear"
    }}
    style={{ top, scale }}
    className="absolute pointer-events-none select-none z-0"
  >
    <div className="relative filter drop-shadow-xl">
      {/* High density core for brightness */}
      <div className="w-32 h-16 bg-white rounded-full shadow-[0_0_40px_rgba(255,255,255,0.8)]" />
      <div className="absolute -top-10 left-8 w-20 h-20 bg-white rounded-full" />
      <div className="absolute -top-6 left-20 w-18 h-18 bg-white/90 rounded-full" />
      <div className="absolute -top-4 -left-4 w-16 h-16 bg-white/80 rounded-full" />
      
      {/* Soft edges for realism */}
      <div className="absolute inset-0 bg-white blur-md rounded-full opacity-60" />
      <div className="absolute -top-8 left-4 w-24 h-24 bg-white blur-xl rounded-full opacity-40" />
    </div>
  </motion.div>
);

export default function DynamicBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none bg-gradient-to-b from-[#E3F2FD] via-[#BBDEFB] to-[#E3F2FD]">
      {/* Sun/Light Glow */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-yellow-100/50 blur-[100px]"
      />

      {/* Floating Clouds */}
      <Cloud delay={0} duration={40} top="15%" scale={1} />
      <Cloud delay={15} duration={55} top="40%" scale={0.7} />
      <Cloud delay={5} duration={45} top="65%" scale={1.2} />
      <Cloud delay={25} duration={50} top="10%" scale={0.5} />
      <Cloud delay={10} duration={60} top="80%" scale={0.8} />

      {/* Subtle RGB Soft Glows (Harmonized with Sky) */}
      <div className="absolute inset-0 opacity-20">
        <motion.div
          animate={{
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400 blur-[150px] rounded-full"
        />
        <motion.div
          animate={{
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 7, repeat: Infinity, delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-300 blur-[150px] rounded-full"
        />
      </div>

      {/* Static Noise Overlay for Texture */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
    </div>
  );
}
