import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_TYPES, DEFAULT_API } from '../config/apiConfig';

// 创建上下文
export const ApiContext = createContext();

// 创建 Provider 组件
export const ApiProvider = ({ children }) => {
  // 从 localStorage 获取存储的 API 类型，如果没有则使用默认值
  const [currentApiType, setCurrentApiType] = useState(() => {
    const savedApiType = localStorage.getItem('currentApiType');
    return savedApiType || DEFAULT_API;
  });

  // 当 API 类型变更时，保存到 localStorage
  useEffect(() => {
    localStorage.setItem('currentApiType', currentApiType);
  }, [currentApiType]);

  // 提供给消费组件的值
  const value = {
    currentApiType,
    setCurrentApiType,
    availableApis: API_TYPES
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};

// 自定义 Hook 以便在函数组件中使用
export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi 必须在 ApiProvider 内部使用');
  }
  return context;
};