import { useState, useEffect, useCallback } from 'react';
import { analyzeNodeHierarchy } from '../utils/hierarchyAnalyzer';

/**
 * 思维导图交互钩子
 * 处理节点点击和相关数据
 */
export const useMindMapInteraction = () => {
  const [lastClickedNode, setLastClickedNode] = useState(null);
  const [relatedRecords, setRelatedRecords] = useState([]);
  const [nodeHierarchy, setNodeHierarchy] = useState([]);
  
  // 获取相关记录的函数
  const fetchRelatedRecords = useCallback((nodeText) => {
    try {
      // 尝试从不同存储键获取数据
      const storageKeys = ['apiResponse', 'abstract', 'summaryData'];
      let records = [];
      
      for (const key of storageKeys) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              records = [...records, ...parsed];
            } else if (parsed && typeof parsed === 'object') {
              // 处理可能的嵌套结构
              const nestedRecords = parsed.records || parsed.data || parsed.items || [];
              if (Array.isArray(nestedRecords)) {
                records = [...records, ...nestedRecords];
              }
            }
          }
        } catch (e) {
          console.warn(`Error parsing ${key} data:`, e);
        }
      }
      
      console.log(`Searching for records related to "${nodeText}" in ${records.length} total records`);
      
      if (records.length > 0) {
        // 先转换一次nodeText为小写，避免重复转换
        const searchText = nodeText.toLowerCase();
        
        // 使用更广泛的匹配条件来查找相关记录
        const related = records.filter(record => {
          if (!record) return false;
          
          // 检查所有可能的字段
          const fieldsToCheck = [
            record.content,
            record.mainPoint,
            record.summary,
            record.text,
            record.title,
            record.description
          ];
          
          return fieldsToCheck.some(field => 
            typeof field === 'string' && field.toLowerCase().includes(searchText)
          );
        });
        
        console.log(`Found ${related.length} related records`);
        setRelatedRecords(related);
      } else {
        console.log('No records found in localStorage');
        setRelatedRecords([]);
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      setRelatedRecords([]);
    }
  }, []);
  
  // 获取思维导图原始数据功能
  const fetchMindMapOriginalData = useCallback(() => {
    try {
      // 从localStorage中获取存储的思维导图数据
      const mindMapData = localStorage.getItem('mindmap_data');
      if (mindMapData) {
        const parsedData = JSON.parse(mindMapData);
        return {
          title: parsedData.title || '',
          code: parsedData.code || '',
          createdAt: parsedData.createdAt || new Date().toISOString()
        };
      }
      return null;
    } catch (error) {
      console.error('获取思维导图原始数据失败:', error);
      return null;
    }
  }, []);

  // 获取多源数据的函数
  const fetchMultiSourceData = useCallback((nodeText, nodeId) => {
    // 1. 获取历史记录摘要
    fetchRelatedRecords(nodeText);
    
    // 2. 获取背景信息
    try {
      const backgroundInfo = localStorage.getItem('lastSavedBackground') || 
                            localStorage.getItem('background') || 
                            '没有背景信息';
      console.log('==== 背景信息 ====');
      console.log(backgroundInfo);
    } catch (error) {
      console.error('获取背景信息失败:', error);
    }
    
    // 3. 直接获取abstract（Main Point）列表
    try {
      console.log('==== Abstract列表 ====');
      const storedData = localStorage.getItem('apiResponse');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          // 获取所有有效的Main Points
          const mainPoints = parsedData
            .filter(item => item && item.mainPoint && item.mainPoint.trim() !== '')
            .map((item, index) => `${index + 1}. ${item.mainPoint}`)
            .join('\n');
          
          console.log(`找到${parsedData.length}条Main Point记录：`);
          console.log(mainPoints);
        } else {
          console.log('没有找到有效的Main Point记录');
        }
      } else {
        console.log('localStorage中没有apiResponse数据');
      }
    } catch (error) {
      console.error('获取abstract失败:', error);
    }
    
    // 4. 保存当前节点信息
    try {
      // 存储当前节点信息
      const simpleHierarchy = [{
        id: nodeId,
        text: nodeText
      }];
      
      setNodeHierarchy(simpleHierarchy);
      
      console.log('==== 节点信息 ====');
      console.log(`当前节点: "${nodeText}" (ID: ${nodeId})`);
    } catch (error) {
      console.error('获取节点信息失败:', error);
    }
    
    // 5. 获取思维导图原始数据和节点层级
    const mindMapOriginalData = fetchMindMapOriginalData();
    if (mindMapOriginalData) {
      console.log('==== 思维导图原始数据 ====');
      console.log(`标题: ${mindMapOriginalData.title}`);
      // 不打印完整代码，可能很长
      console.log(`代码摘要: ${mindMapOriginalData.code.slice(0, 1000)}...`);
      console.log(`创建时间: ${new Date(mindMapOriginalData.createdAt).toLocaleString()}`);
      
      // 分析节点层级关系
      const hierarchy = analyzeNodeHierarchy(mindMapOriginalData.code, nodeText);
      if (hierarchy.length > 0) {
        // 更新节点层级状态
        setNodeHierarchy(hierarchy.map((node, index) => ({
          id: `level-${index}`,  // 生成一个虚拟ID
          text: node.text,
          level: node.level
        })));
      } else {
        // 如果分析失败，仍然保存当前节点
        setNodeHierarchy([{
          id: nodeId,
          text: nodeText,
          level: -1  // 未知层级
        }]);
      }
    } else {
      console.log('未找到思维导图原始数据');
    }
    
    // 整合日志输出
    console.log('==== 节点信息汇总 ====');
    console.log(`节点文本: ${nodeText}`);
    console.log(`节点ID: ${nodeId}`);
    console.log(`相关记录数: ${relatedRecords.length}`);
  }, [fetchRelatedRecords, relatedRecords.length, fetchMindMapOriginalData]);

  // 处理节点点击的函数
  const handleNodeClick = useCallback((event) => {
    const { nodeId, nodeText } = event.detail || {};
    
    if (!nodeText) return; // 如果没有文本内容直接返回
    
    console.log('==== 节点点击事件 ====');
    console.log(`点击的节点: ${nodeText} (ID: ${nodeId})`);
    
    setLastClickedNode({ id: nodeId, text: nodeText });
    
    // 获取多源数据
    fetchMultiSourceData(nodeText, nodeId);
  }, [fetchMultiSourceData]);
  
  // 添加全局事件监听器
  useEffect(() => {
    window.addEventListener('mindmap-node-click', handleNodeClick);
    
    // 清理函数
    return () => {
      window.removeEventListener('mindmap-node-click', handleNodeClick);
    };
  }, [handleNodeClick]);

  return {
    lastClickedNode,
    relatedRecords,
    nodeHierarchy,
    handleNodeClick,
    getMindMapOriginalData: fetchMindMapOriginalData
  };
};