import { useState, useEffect, useCallback } from 'react';
import { analyzeNodeHierarchy } from '../utils/hierarchyAnalyzer';
import { expandNode, mergeNodeExpansionToMindMap } from '../../../utils/nodeExpansionUtil';
import { storageService } from '../../../services/storageService'; // 添加导入

/**
 * 思维导图交互钩子 - 优化版本
 * 专注于获取并展示四类核心信息:
 * 1. 背景信息
 * 2. Main Points列表
 * 3. 节点层级关系
 * 4. 节点文本信息
 */
export const useMindMapInteraction = (initialMindMapData) => {
  const [lastClickedNode, setLastClickedNode] = useState(null);
  const [relatedRecords, setRelatedRecords] = useState([]);
  const [nodeHierarchy, setNodeHierarchy] = useState([]);
  const [backgroundInfo, setBackgroundInfo] = useState('');
  const [mainPoints, setMainPoints] = useState([]);
  const [isExpanding, setIsExpanding] = useState(false);
  const [expandError, setExpandError] = useState(null);
  const [mindMapUpdated, setMindMapUpdated] = useState(false);
  
  // 获取相关记录的函数 - 使用 storageService 获取主要数据
  const fetchRelatedRecords = useCallback((nodeText) => {
    try {
      let records = [];
      
      // 1. 从 storageService 获取主要历史数据
      const historyRecords = storageService.getHistoryRecords();
      if (Array.isArray(historyRecords)) {
        records = [...records, ...historyRecords];
      }
      
      // 2. 获取辅助存储中的数据
      // 注：这部分可以考虑在未来迁移到 storageService 中
      const auxiliaryKeys = ['abstract', 'summaryData'];
      for (const key of auxiliaryKeys) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              records = [...records, ...parsed];
            } else if (parsed && typeof parsed === 'object') {
              const nestedRecords = parsed.records || parsed.data || parsed.items || [];
              if (Array.isArray(nestedRecords)) {
                records = [...records, ...nestedRecords];
              }
            }
          }
        } catch (e) {
          console.warn(`解析辅助存储键 ${key} 数据失败:`, e);
        }
      }
      
      // 过滤与节点文本相关的记录
      if (records.length > 0 && nodeText) {
        const searchText = nodeText.toLowerCase();
        const related = records.filter(record => {
          if (!record) return false;
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
        setRelatedRecords(related);
        
        // 添加日志，记录找到相关记录的数量
        console.log(`找到 ${related.length} 条与节点文本 "${nodeText}" 相关的记录`);
      } else {
        setRelatedRecords([]);
        console.log(`未找到与节点文本 "${nodeText || '空'}" 相关的记录`);
      }
    } catch (error) {
      console.error('获取相关记录失败:', error);
      setRelatedRecords([]);
    }
  }, []);
  
  // 获取思维导图原始数据功能 - 使用 storageService
  const fetchMindMapOriginalData = useCallback(() => {
    return storageService.getMindMapData();
  }, []);

  // 获取关键信息的统一函数
  const fetchKeyInformation = useCallback((nodeText, nodeId) => {
    // 1. 获取相关记录 (保留但不是重点)
    fetchRelatedRecords(nodeText);
    
    // 2. 获取背景信息 (重点1) - 使用 storageService
    try {
      const bgInfo = storageService.getBackgroundInfo();
      setBackgroundInfo(bgInfo);
      console.log('==== 背景信息 ====');
      console.log(bgInfo || '没有背景信息');
    } catch (error) {
      console.error('获取背景信息失败:', error);
      setBackgroundInfo('');
    }
    
    // 3. 获取Main Points列表 (重点2) - 使用 storageService
    try {
      console.log('==== Abstract列表 ====');
      // 使用 storageService 获取历史记录
      const records = storageService.getHistoryRecords();
      
      if (Array.isArray(records) && records.length > 0) {
        // 提取有效的Main Points
        const points = records
          .filter(item => item && item.mainPoint && item.mainPoint.trim() !== '')
          .map(item => item.mainPoint);
        
        setMainPoints(points);
        
        // 格式化输出
        const formattedPoints = points.map((point, index) => `${index + 1}. ${point}`).join('\n');
        console.log(`找到${points.length}条Main Point记录：`);
        console.log(formattedPoints);
      } else {
        console.log('没有找到有效的Main Point记录');
        setMainPoints([]);
      }
    } catch (error) {
      console.error('获取abstract失败:', error);
      setMainPoints([]);
    }
    
    // 4. 节点文本信息 (重点4)
    console.log('==== 节点信息 ====');
    console.log(`当前节点: "${nodeText}" (ID: ${nodeId})`);
    
    // 5. 获取并分析节点层级关系 (重点3) - 使用 storageService
    // 注意：fetchMindMapOriginalData 也应当更新为使用 storageService
    const mindMapOriginalData = storageService.getMindMapData();
    if (mindMapOriginalData) {
      console.log('==== 思维导图原始数据 ====');
      console.log(`标题: ${mindMapOriginalData.title}`);
      console.log(`代码摘要: ${mindMapOriginalData.code.slice(0, 1000)}...`);
      console.log(`创建时间: ${new Date(mindMapOriginalData.createdAt).toLocaleString()}`);
      
      // 分析节点层级关系
      const hierarchy = analyzeNodeHierarchy(mindMapOriginalData.code, nodeText);
      if (hierarchy.length > 0) {
        // 更新节点层级状态
        setNodeHierarchy(hierarchy);
      } else {
        // 如果分析失败，仍然保存当前节点
        setNodeHierarchy([{
          text: nodeText,
          level: -1  // 未知层级
        }]);
      }
    } else {
      console.log('未找到思维导图原始数据');
      setNodeHierarchy([{ text: nodeText, level: -1 }]);
    }
    
    // 日志总结
    console.log('==== 节点信息汇总 ====');
    console.log(`节点文本: ${nodeText}`);
    console.log(`节点ID: ${nodeId}`);
    console.log(`相关记录数: ${relatedRecords.length}`);
  }, [fetchRelatedRecords, relatedRecords.length]);

  // 使用 storageService 替换直接 localStorage 访问
  const fetchBackgroundInfo = useCallback(() => {
    return storageService.getBackgroundInfo();
  }, []);

  const fetchHistoryPoints = useCallback(() => {
    return storageService.getHistoryPoints();
  }, []);

  // 处理节点点击的函数
  const handleNodeClick = useCallback((event) => {
    const { nodeId, nodeText } = event.detail;
    
    // 使用这些函数获取上下文信息
    const backgroundInfo = fetchBackgroundInfo();
    const historyPoints = fetchHistoryPoints();
    
    console.log(`节点点击: ${nodeId} - ${nodeText}`);
    console.log(`上下文: 背景信息 "${backgroundInfo}", ${historyPoints.length} 条历史记录`);
    
    // 设置当前选中节点
    setLastClickedNode({ id: nodeId, text: nodeText });
    
    // 获取节点相关信息
    fetchKeyInformation(nodeText, nodeId);
  }, [fetchBackgroundInfo, fetchHistoryPoints, fetchKeyInformation]);
  
  // 添加全局事件监听器
  useEffect(() => {
    window.addEventListener('mindmap-node-click', handleNodeClick);
    
    return () => {
      window.removeEventListener('mindmap-node-click', handleNodeClick);
    };
  }, [handleNodeClick]);

  // 新增：扩展节点函数
  const expandCurrentNode = useCallback(async () => {
    // 验证是否有选中的节点
    if (!lastClickedNode || !lastClickedNode.text) {
      setExpandError('请先选择一个节点');
      return null;
    }
    
    setExpandError(null);
    
    // 获取思维导图原始数据
    const mindMapData = fetchMindMapOriginalData();
    if (!mindMapData || !mindMapData.code) {
      setExpandError('无法获取思维导图数据');
      return null;
    }
    
    try {
      setIsExpanding(true);
      
      // 调用节点扩展功能
      const childNodes = await expandNode({
        nodeText: lastClickedNode.text,
        nodeId: lastClickedNode.id,
        originalMindMapCode: mindMapData.code,
        backgroundInfo,
        mainPoints,
        nodeHierarchy,
        onProcessing: setIsExpanding
      });
      
      // 检查是否成功生成子节点
      if (!childNodes || childNodes.length === 0) {
        setExpandError('未能生成任何子节点');
        return null;
      }
      
      console.log(`成功为节点 "${lastClickedNode.text}" 生成 ${childNodes.length} 个子节点`);
      
      // 合并到原思维导图
      const updatedMindMapCode = mergeNodeExpansionToMindMap(
        mindMapData.code,
        lastClickedNode.text,
        childNodes
      );
      
      // 保存更新后的思维导图数据
      if (updatedMindMapCode && updatedMindMapCode !== mindMapData.code) {
        const updatedMindMapData = {
          ...mindMapData,
          code: updatedMindMapCode,
          lastUpdated: new Date().toISOString()
        };
        
        // 使用 storageService 保存（替换直接调用 saveMindMapDataToLocalStorage）
        storageService.saveMindMapData(updatedMindMapData);
        
        // 标记已更新
        setMindMapUpdated(true);
        
        return updatedMindMapData;
      }
      
      return null;
    } catch (err) {
      console.error('节点扩展失败:', err);
      setExpandError(`扩展失败: ${err.message || '未知错误'}`);
      return null;
    } finally {
      setIsExpanding(false);
    }
  }, [lastClickedNode, backgroundInfo, mainPoints, nodeHierarchy, fetchMindMapOriginalData]);
  
  // 重置更新标志
  const resetMindMapUpdated = useCallback(() => {
    setMindMapUpdated(false);
  }, []);

  return {
    lastClickedNode,
    relatedRecords,
    nodeHierarchy,
    backgroundInfo,    // 新增：直接提供背景信息
    mainPoints,        // 新增：直接提供Main Points列表
    handleNodeClick,
    getMindMapOriginalData: fetchMindMapOriginalData,
    
    // 节点扩展相关
    expandCurrentNode,     // 新增：扩展当前选中节点
    isExpanding,           // 新增：正在扩展中
    expandError,           // 新增：扩展错误信息
    mindMapUpdated,        // 新增：思维导图是否已更新
    resetMindMapUpdated    // 新增：重置更新标志
  };
};