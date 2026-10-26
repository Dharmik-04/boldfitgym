'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Program {
  id: string;
  title: string;
  icon: string;
  description: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  billing: string;
  features: string[];
  popular: boolean;
}

export interface HeroConfig {
  title: string;
  subtitle: string;
  bgImageSrc: string;
  mediaSrc: string;
}

interface AppContextType {
  heroConfig: HeroConfig;
  setHeroConfig: React.Dispatch<React.SetStateAction<HeroConfig>>;
  programs: Program[];
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
  pricingPlans: PricingPlan[];
  setPricingPlans: React.Dispatch<React.SetStateAction<PricingPlan[]>>;
  resetToDefaults: () => void;
}

const defaultHeroConfig: HeroConfig = {
  title: 'Bold Fitness',
  subtitle: 'The Ultimate Training Ground',
  bgImageSrc: '/gym-bg.jpg',
  mediaSrc: '/gym-3d.webm',
};

const defaultPrograms: Program[] = [
  {
    id: '1',
    title: 'Hypertrophy & Strength',
    icon: 'Dumbbell',
    description: 'Build absolute raw power and high muscle volume with elite structural programming.',
  },
  {
    id: '2',
    title: 'Functional CrossFit',
    icon: 'Flame',
    description: 'High-intensity metabolic conditioning, gymnastics, and precision weightlifting.',
  },
  {
    id: '3',
    title: '1-on-1 Coaching',
    icon: 'UserCheck',
    description: 'Personalized training routines, custom nutrition plans, and direct accountability.',
  },
  {
    id: '4',
    title: 'Recovery & Sauna',
    icon: 'Wind',
    description: 'Infrared saunas, custom cold plunges, and compression therapies for muscle repair.',
  },
];

const defaultPricingPlans: PricingPlan[] = [
  {
    id: '1',
    name: 'Day Pass',
    price: '19',
    billing: 'per day',
    features: ['Access to lifting floor', 'Basic locker & sauna access', 'Complimentary towel service'],
    popular: false,
  },
  {
    id: '2',
    name: 'Pro Access',
    price: '49',
    billing: 'per month',
    features: ['Unlimited gym entry', 'All functional classes', '1 recovery session / week', '24/7 keycard access'],
    popular: true,
  },
  {
    id: '3',
    name: 'VIP Athlete',
    price: '149',
    billing: 'per month',
    features: ['1-on-1 coaching session / week', 'Unlimited group classes', 'Sauna & cold plunge pass', 'Customized nutrition tracking'],
    popular: false,
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [heroConfig, setHeroConfig] = useState<HeroConfig>(defaultHeroConfig);
  const [programs, setPrograms] = useState<Program[]>(defaultPrograms);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>(defaultPricingPlans);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const storedHero = localStorage.getItem('gym_heroConfig');
      const storedPrograms = localStorage.getItem('gym_programs');
      const storedPricing = localStorage.getItem('gym_pricingPlans');

      if (storedHero) setHeroConfig(JSON.parse(storedHero));
      if (storedPrograms) setPrograms(JSON.parse(storedPrograms));
      if (storedPricing) setPricingPlans(JSON.parse(storedPricing));
    } catch (e) {
      console.error('Failed to load state from localStorage', e);
    }
  }, []);

  // Save to LocalStorage when states change
  useEffect(() => {
    localStorage.setItem('gym_heroConfig', JSON.stringify(heroConfig));
  }, [heroConfig]);

  useEffect(() => {
    localStorage.setItem('gym_programs', JSON.stringify(programs));
  }, [programs]);

  useEffect(() => {
    localStorage.setItem('gym_pricingPlans', JSON.stringify(pricingPlans));
  }, [pricingPlans]);

  const resetToDefaults = () => {
    setHeroConfig(defaultHeroConfig);
    setPrograms(defaultPrograms);
    setPricingPlans(defaultPricingPlans);
  };

  return (
    <AppContext.Provider
      value={{
        heroConfig,
        setHeroConfig,
        programs,
        setPrograms,
        pricingPlans,
        setPricingPlans,
        resetToDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
