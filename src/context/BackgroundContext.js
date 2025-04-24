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

  // 同步localStorage和state - 无论是否为空值
  useEffect(() => {
    // 不论savedBackground是什么值，都更新localStorage
    if (savedBackground !== undefined) { // 只要不是undefined就更新
      if (savedBackground) {
        window.localStorage.setItem('lastSavedBackground', savedBackground);
      } else {
        // 当savedBackground为空字符串时，明确删除localStorage项
        window.localStorage.removeItem('lastSavedBackground');
      }
      console.log(`Background context synced to localStorage: "${savedBackground}"`);
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