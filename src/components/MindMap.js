import React, { useEffect, useState } from 'react';
import MindMapContainer from './mindmap/MindMapContainer';

/**
 * MindMap 入口组件
 * 增强版：确保上下文和历史数据的有效传递
 */
const MindMap = (props) => {
  const [contextInfo, setContextInfo] = useState({
    historyPoints: [],
    backgroundInfo: ''
  });

  // 在组件挂载时获取完整的历史数据和背景信息
  useEffect(() => {
    try {
      console.group('MindMap: 收集上下文数据');

      // 1. 获取所有历史 Main Points
      const apiResponse = localStorage.getItem('apiResponse');
      let historyPoints = [];
      
      if (apiResponse) {
        try {
          const historyRecords = JSON.parse(apiResponse);
          if (Array.isArray(historyRecords)) {
            historyPoints = historyRecords
              .filter(record => record && record.mainPoint && record.mainPoint.trim())
              .map(record => record.mainPoint);
            
            console.log(`找到 ${historyPoints.length} 条历史记录点`);
            if (historyPoints.length > 0) {
              console.log('样本:', historyPoints.slice(-3));
            }
          }
        } catch (err) {
          console.error('解析 apiResponse 时出错:', err);
        }
      }

      // 2. 获取背景信息
      const backgroundInfo = localStorage.getItem('lastSavedBackground') || '';
      console.log('背景信息是否存在:', !!backgroundInfo);
      
      // 3. 更新状态
      setContextInfo({
        historyPoints,
        backgroundInfo
      });

      console.groupEnd();
    } catch (error) {
      console.error('获取上下文信息时出错:', error);
    }
  }, []);

  return (
    <MindMapContainer 
      {...props} 
      useFullContext={true}
      contextInfo={contextInfo}
    />
  );
};

export default MindMap;