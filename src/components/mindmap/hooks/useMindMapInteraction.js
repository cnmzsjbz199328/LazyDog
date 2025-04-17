import { useState, useEffect, useCallback } from 'react';

/**
 * 思维导图交互钩子
 * 处理节点点击和相关数据
 */
export const useMindMapInteraction = () => {
  const [lastClickedNode, setLastClickedNode] = useState(null);
  const [relatedRecords, setRelatedRecords] = useState([]);
  
  // 获取相关记录的函数
  const fetchRelatedRecords = useCallback((nodeText) => {
    try {
      const apiResponse = localStorage.getItem('apiResponse');
      if (apiResponse) {
        const records = JSON.parse(apiResponse);
        console.log(`Searching for records related to "${nodeText}"`);
        
        if (Array.isArray(records)) {
          // 使用更广泛的匹配条件来查找相关记录
          const related = records.filter(record => 
            record && 
            ((record.content && record.content.toLowerCase().includes(nodeText.toLowerCase())) || 
             (record.mainPoint && record.mainPoint.toLowerCase().includes(nodeText.toLowerCase())))
          );
          
          console.log(`Found ${related.length} related records`);
          setRelatedRecords(related);
        }
      } else {
        console.log('No records found in localStorage');
        setRelatedRecords([]);
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      setRelatedRecords([]);
    }
  }, []);

  // 处理节点点击的函数
  const handleNodeClick = useCallback((event) => {
    console.log('接收到mindmap-node-click事件:', event);
    
    if (event.detail && event.detail.nodeId && event.detail.nodeText) {
      const nodeId = event.detail.nodeId;
      const nodeText = event.detail.nodeText;
      
      console.log(`模态框接收到节点点击: ${nodeId} - "${nodeText}"`);
      
      // 设置最后点击的节点
      setLastClickedNode({
        id: nodeId,
        text: nodeText
      });
      
      // 查询localStorage中的摘要数据
      fetchRelatedRecords(nodeText);
    } else {
      console.warn('收到的事件缺少必要的detail属性:', event);
    }
  }, [fetchRelatedRecords]);
  
  // 添加全局事件监听器
  useEffect(() => {
    console.log('添加mindmap-node-click全局事件监听器');
    window.addEventListener('mindmap-node-click', handleNodeClick);
    
    // 清理函数
    return () => {
      console.log('移除mindmap-node-click全局事件监听器');
      window.removeEventListener('mindmap-node-click', handleNodeClick);
    };
  }, [handleNodeClick]);

  return {
    lastClickedNode,
    relatedRecords,
    handleNodeClick
  };
};