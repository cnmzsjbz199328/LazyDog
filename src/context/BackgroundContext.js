import React, { createContext, useState, useContext, useEffect } from 'react';

const BackgroundContext = createContext();

export function BackgroundProvider({ children }) {
  // 尝试从localStorage获取初始值
  const getInitialBackground = () => {
    const stored = window.localStorage.getItem('lastSavedBackground');
    return stored || '';
  };

  const [backgroundInfo, setBackgroundInfo] = useState(getInitialBackground);
  const [savedBackground, setSavedBackground] = useState(getInitialBackground);

  // 同步localStorage和state
  useEffect(() => {
    if (savedBackground) {
      window.localStorage.setItem('lastSavedBackground', savedBackground);
    }
  }, [savedBackground]);

  return (
    <BackgroundContext.Provider value={{ 
      backgroundInfo, 
      setBackgroundInfo, 
      savedBackground, 
      setSavedBackground 
    }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackgroundContext() {
  return useContext(BackgroundContext);
}