import React, { createContext, useState, useContext, useEffect } from 'react';
import { storageService } from '../services/storageService'; // 修改导入

const BackgroundContext = createContext();

export function BackgroundProvider({ children }) {
  // 使用 storageService 获取初始背景信息
  const getInitialBackground = () => {
    return storageService.getBackgroundInfo();
  };

  const [backgroundInfo, setBackgroundInfo] = useState(getInitialBackground);
  const [savedBackground, setSavedBackground] = useState(getInitialBackground);

  // 当 savedBackground 变化时，使用 storageService 更新
  useEffect(() => {
    if (savedBackground !== undefined) {
      storageService.setBackgroundInfo(savedBackground);
      console.log(`Background context synced: "${savedBackground}"`);
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