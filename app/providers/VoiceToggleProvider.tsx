import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface VoiceToggleContextType {
  isVoiceEnabled: boolean;
  toggleVoice: () => void;
}

const VoiceToggleContext = createContext<VoiceToggleContextType>({
  isVoiceEnabled: false,
  toggleVoice: () => {},
});

interface VoiceToggleProviderProps {
  children: ReactNode;
}

export const VoiceToggleProvider: React.FC<VoiceToggleProviderProps> = ({ children }) => {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(false);

  const toggleVoice = () => {
    setIsVoiceEnabled(prev => !prev);
  };

  return (
    <VoiceToggleContext.Provider value={{ isVoiceEnabled, toggleVoice }}>
      {children}
    </VoiceToggleContext.Provider>
  );
};

export const useVoiceToggle = () => {
  const context = useContext(VoiceToggleContext);
  if (context === undefined) {
    throw new Error('useVoiceToggle must be used within a VoiceToggleProvider');
  }
  return context;
};
