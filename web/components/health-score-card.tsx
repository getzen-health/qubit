import { CircleCheck, CircleAlert, Flame, Droplet, Dumbbell, Smile, Activity, Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = [
  { min: 80, color: 'text-green-600', ring: 'stroke-green-400' },
  { min: 60, color: 'text-yellow-600', ring: 'stroke-yellow-400' },
  { min: 40, color: 'text-orange-600', ring: 'stroke-orange-400' },
  { min: 0, color: 'text-red-600', ring: 'stroke-red-400' },
];

function getColor(score: number) {
  return COLORS.find(c => score >= c.min) || COLORS[3];
}

export function HealthScoreCard({ score, components, grade }: any) {
  const color = getColor(score);
  return (
    <div className="bg-surface rounded-xl p-4 shadow flex flex-col items-center">
      <div className="relative mb-2">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="44" fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle
            cx="48" cy="48" r="44" fill="none"
            strokeLinecap="round"
            strokeWidth="8"
            className={color.ring}
            strokeDasharray={276}
            strokeDashoffset={276 - (score / 100) * 276}
            style={{ transition: 'stroke-dashoffset 0.5s' }}
          />
        </svg>
        <span className={cn('absolute inset-0 flex flex-col items-center justify-center text-3xl font-bold', color.color)}>
          {score}
          <span className="text-base font-medium">/100</span>
        </span>
      </div>
      <div className="text-lg font-semibold mb-1">Daily Health Score <span className="ml-2 text-xs font-bold">{grade}</span></div>
      <div className="grid grid-cols-3 gap-2 mt-2 w-full text-xs">
        <div className="flex items-center gap-1"><Footprints className="w-4 h-4" /> Steps: <b>{components.steps.value}</b></div>
        <div className="flex items-center gap-1"><Flame className="w-4 h-4" /> Workout: <b>{components.workout.value ? 'Yes' : 'No'}</b></div>
        <div className="flex items-center gap-1"><Droplet className="w-4 h-4" /> Water: <b>{components.water.value}L</b></div>
        <div className="flex items-center gap-1"><Smile className="w-4 h-4" /> Mood: <b>{components.mood.value}</b></div>
        <div className="flex items-center gap-1"><Activity className="w-4 h-4" /> Stress: <b>{components.stress.value}</b></div>
        <div className="flex items-center gap-1"><Dumbbell className="w-4 h-4" /> Sleep: <b>{components.sleep.value}h</b></div>
      </div>
    </div>
  );
}
