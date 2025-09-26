import { useState, useEffect } from 'react';

export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';
export type ContrastMode = 'normal' | 'high';

interface AccessibilityPreferences {
  fontSize: FontSize;
  contrastMode: ContrastMode;
  reducedMotion: boolean;
}

const defaultPreferences: AccessibilityPreferences = {
  fontSize: 'medium',
  contrastMode: 'normal',
  reducedMotion: false,
};

export function useAccessibility() {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('accessibility-preferences');
      return stored ? JSON.parse(stored) : defaultPreferences;
    }
    return defaultPreferences;
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply font size
    const fontSizeMap = {
      'small': '0.875rem',
      'medium': '1rem',
      'large': '1.125rem',
      'extra-large': '1.25rem'
    };
    root.style.setProperty('--accessibility-font-size', fontSizeMap[preferences.fontSize]);
    
    // Apply contrast mode
    if (preferences.contrastMode === 'high') {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply reduced motion
    if (preferences.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Store preferences
    localStorage.setItem('accessibility-preferences', JSON.stringify(preferences));
  }, [preferences]);

  const setFontSize = (fontSize: FontSize) => {
    setPreferences(prev => ({ ...prev, fontSize }));
  };

  const setContrastMode = (contrastMode: ContrastMode) => {
    setPreferences(prev => ({ ...prev, contrastMode }));
  };

  const setReducedMotion = (reducedMotion: boolean) => {
    setPreferences(prev => ({ ...prev, reducedMotion }));
  };

  const resetToDefaults = () => {
    setPreferences(defaultPreferences);
  };

  return {
    preferences,
    setFontSize,
    setContrastMode,
    setReducedMotion,
    resetToDefaults,
  };
}