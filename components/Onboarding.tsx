import React, { useState } from 'react';
import { UserPreferences, Mood, GroupType } from '../types';
import { MOODS, GROUP_TYPES, ACTIVITIES } from '../constants';
import Button from './Button';

interface OnboardingProps {
  onComplete: (prefs: UserPreferences) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [prefs, setPrefs] = useState<UserPreferences>({
    mood: Mood.ENERGETIC,
    groupType: GroupType.FRIENDS,
    budget: 50,
    activities: []
  });

  const updatePrefs = (key: keyof UserPreferences, value: any) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  const toggleActivity = (activity: string) => {
    setPrefs(prev => {
      const exists = prev.activities.includes(activity);
      if (exists) {
        return { ...prev, activities: prev.activities.filter(a => a !== activity) };
      } else {
        return { ...prev, activities: [...prev.activities, activity] };
      }
    });
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const renderStep1_Group = () => (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-3xl font-bold text-white tracking-tight">
        Who's with you?
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {GROUP_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => updatePrefs('groupType', type.value)}
            className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden group ${
              prefs.groupType === type.value
                ? 'border-transparent text-white shadow-lg shadow-orange-500/30 transform scale-[1.02]'
                : 'border-white/10 bg-black/20 text-slate-400 hover:bg-black/40 hover:border-white/20'
            }`}
          >
            {prefs.groupType === type.value && (
               <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 opacity-100 z-0" />
            )}
            <div className="relative z-10 text-xl font-bold tracking-wide">{type.label}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2_Mood = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-3xl font-bold text-white tracking-tight">
        What's the vibe?
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {MOODS.map((m) => (
          <button
            key={m.value}
            onClick={() => updatePrefs('mood', m.value)}
            className={`flex items-center p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
              prefs.mood === m.value
                ? 'border-transparent text-white shadow-lg shadow-orange-500/30 translate-x-1'
                : 'border-white/10 bg-black/20 text-slate-400 hover:bg-black/40'
            }`}
          >
             {prefs.mood === m.value && (
               <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 opacity-90 z-0" />
            )}
            <span className="text-3xl mr-5 relative z-10">
              <ion-icon name={m.icon}></ion-icon>
            </span>
            <span className="text-lg font-bold relative z-10">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep3_BudgetAndActivity = () => (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-3xl font-bold text-white tracking-tight">
        The Details
      </h2>
      
      <div className="space-y-4 bg-black/20 p-5 rounded-3xl border border-white/5 backdrop-blur-sm">
        <label className="text-slate-300 text-xs font-bold uppercase tracking-widest">Budget Estimate</label>
        <input 
          type="range" 
          min="1000" 
          max="200000" 
          step="5000"
          value={prefs.budget}
          onChange={(e) => updatePrefs('budget', parseInt(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
        />
        <div className="flex justify-between text-white font-bold text-sm">
          <span className="text-slate-500">Thrifty</span>
          <span className="text-orange-400">KES.{prefs.budget}</span>
          <span className="text-slate-500">Splurge</span>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-slate-300 text-xs font-bold uppercase tracking-widest">Interests</label>
        <div className="flex flex-wrap gap-2">
          {ACTIVITIES.map(act => (
            <button
              key={act}
              onClick={() => toggleActivity(act)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                prefs.activities.includes(act)
                  ? 'bg-white text-vibe-dark shadow-lg scale-105'
                  : 'bg-black/30 text-slate-400 border border-white/10 hover:bg-black/50'
              }`}
            >
              {act}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto w-full p-4 flex flex-col min-h-[50vh] justify-between backdrop-blur-sm bg-black/10 rounded-3xl mt-4">
      <div className="flex-1">
        {step === 1 && renderStep1_Group()}
        {step === 2 && renderStep2_Mood()}
        {step === 3 && renderStep3_BudgetAndActivity()}
      </div>

      <div className="mt-8 flex gap-4">
        {step > 1 && (
          <Button variant="ghost" onClick={prevStep} className="px-6 text-white/50 hover:text-white">Back</Button>
        )}
        {step < 3 ? (
          <Button fullWidth onClick={nextStep} className="rounded-2xl">Next</Button>
        ) : (
          <Button fullWidth onClick={() => onComplete(prefs)} className="rounded-2xl shadow-xl shadow-orange-500/20">Find My Vibe</Button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
