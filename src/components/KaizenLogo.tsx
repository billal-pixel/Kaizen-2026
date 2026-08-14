import React from 'react';

interface KaizenLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const KaizenLogo: React.FC<KaizenLogoProps> = ({
  className = '',
  size = 'md',
  showText = false
}) => {
  const dimensions = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className={`relative ${dimensions} shrink-0 group`}>
        {/* Ambient Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#30AFFF] to-[#92EEFF] rounded-2xl blur-sm opacity-50 group-hover:opacity-100 transition duration-300 pointer-events-none" />
        
        {/* SVG Shield & Samurai Mascot */}
        <svg 
          viewBox="0 0 500 500" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-xl"
        >
          <defs>
            <linearGradient id="shieldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#30AFFF" />
              <stop offset="50%" stopColor="#92EEFF" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#30AFFF" />
              <stop offset="100%" stopColor="#92EEFF" />
            </linearGradient>
            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Shield Shell */}
          <path 
            d="M 250,45 L 390,110 L 370,300 L 250,440 L 130,300 L 110,110 Z" 
            fill="#090d16" 
            stroke="url(#shieldBorder)" 
            strokeWidth="16" 
            strokeLinejoin="round" 
          />

          {/* Inner Shield Ring */}
          <path 
            d="M 250,70 L 365,125 L 348,285 L 250,410 L 152,285 L 135,125 Z" 
            fill="#0f172a" 
            stroke="#1e293b" 
            strokeWidth="8" 
            strokeLinejoin="round" 
          />

          {/* Shield Highlight Crest */}
          <path 
            d="M 250,85 L 345,132 L 332,270 L 250,380 L 168,270 L 155,132 Z" 
            fill="#1e293b" 
            opacity="0.9"
          />

          {/* Katana Handle (Tsuka) extending from back right */}
          <g transform="translate(320, 160) rotate(-35)">
            {/* Blade guard (Tsuba) */}
            <rect x="0" y="40" width="45" height="10" rx="3" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
            {/* Handle wrapped grip */}
            <rect x="10" y="-30" width="25" height="70" rx="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="3" />
            {/* Diamond wrap pattern */}
            <path d="M 10,-20 L 35,-10 M 10,0 L 35,10 M 10,20 L 35,30" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
            {/* Pommel */}
            <rect x="8" y="-38" width="29" height="8" rx="2" fill="#38bdf8" />
          </g>

          {/* Samurai Character Shadow / Torso */}
          <path 
            d="M 180,360 C 200,320 230,300 250,300 C 270,300 300,320 320,360 L 340,390 L 160,390 Z" 
            fill="#e2e8f0" 
          />
          <path 
            d="M 210,315 L 250,365 L 290,315 Z" 
            fill="#0f172a" 
          />

          {/* Samurai Conical Kasa Hat */}
          <g>
            {/* Main Kasa Hat Cone Shape */}
            <path 
              d="M 250,140 L 385,270 C 320,295 180,295 115,270 Z" 
              fill="#1e293b" 
              stroke="#38bdf8" 
              strokeWidth="10" 
              strokeLinejoin="round" 
            />
            {/* Kasa Straw Folds & Highlights */}
            <path d="M 250,145 L 210,278" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
            <path d="M 250,145 L 260,282" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
            <path d="M 250,145 L 310,275" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
            <path d="M 250,145 L 160,268" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
            {/* Under-Hat Shadow */}
            <path d="M 140,268 C 200,285 300,285 360,268 C 320,310 180,310 140,268 Z" fill="#090d16" />
            {/* Glowing Cyan Eye slit under hat */}
            <path d="M 210,280 Q 250,288 290,280" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" filter="url(#glowEffect)" />
          </g>

          {/* Outer Cyan Accent Lines on Shield */}
          <path 
            d="M 120,100 L 250,38 L 380,100" 
            stroke="#38bdf8" 
            strokeWidth="6" 
            strokeLinecap="round" 
          />

          {/* Bottom Banner Outer Box */}
          <rect 
            x="90" 
            y="385" 
            width="320" 
            height="70" 
            rx="10" 
            fill="#090d16" 
            stroke="#38bdf8" 
            strokeWidth="10" 
          />

          {/* Banner Text - KAIZEN */}
          <text 
            x="250" 
            y="432" 
            textAnchor="middle" 
            fill="#38bdf8" 
            fontSize="44" 
            fontWeight="900" 
            fontFamily="system-ui, sans-serif" 
            letterSpacing="3"
          >
            KAIZEN
          </text>

          {/* Sub Banner - TEAM */}
          <rect 
            x="170" 
            y="450" 
            width="160" 
            height="32" 
            rx="6" 
            fill="#38bdf8" 
          />
          <text 
            x="250" 
            y="472" 
            textAnchor="middle" 
            fill="#090d16" 
            fontSize="22" 
            fontWeight="900" 
            fontFamily="system-ui, sans-serif" 
            letterSpacing="2"
          >
            TEAM
          </text>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold text-slate-100 tracking-tight text-lg leading-tight uppercase font-sans bg-gradient-to-r from-cyan-300 via-cyan-100 to-slate-100 bg-clip-text text-transparent">
            TEAM KAIZEN
          </span>
          <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase">
            Command Center
          </span>
        </div>
      )}
    </div>
  );
};
