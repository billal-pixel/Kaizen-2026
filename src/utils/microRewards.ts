/**
 * Kaizen Micro-Reward Celebration Utility
 * Provides non-intrusive sensory delight on habit & task completions.
 */

// Soft Web Audio chime generator (zero external audio files needed)
let audioCtx: AudioContext | null = null;

export const playKaizenCompletionSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    // Gentle melodic Kaizen arpeggio (C5 -> E5 -> G5)
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.16);

    // Soft, pleasant volume envelope (peak 0.04 to avoid startling user)
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.04, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch {
    // AudioContext blocked by browser autoplay policy or disabled - gracefully ignore
  }
};

const KAIZEN_QUOTES = [
  "✨ +1% Continuous Improvement: Habit completed!",
  "🚀 Kaizen Momentum: Small steps compound daily!",
  "🎯 Focus Victory: Another operational hurdle cleared.",
  "🌟 Excellence in action: Consistency beats intensity.",
  "🔥 Kaizen Streak: Daily discipline powers team growth.",
  "💎 Pristine Execution: Task wrapped up with precision!"
];

export const getRandomKaizenReward = (): string => {
  return KAIZEN_QUOTES[Math.floor(Math.random() * KAIZEN_QUOTES.length)];
};
