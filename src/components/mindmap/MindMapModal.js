import React, { useState, useEffect, useCallback, useRef } from 'react';
import Modal from '../Modal';
import MindMapDisplay from './components/MindMapDisplay';
import { useMindMapInteraction } from './hooks/useMindMapInteraction';
import styles from '../css/MindMap.module.css';

/**
 * 思维导图模态框组件
 */
const MindMapModal = ({ show, onClose, svgContent, isProcessing, onMindMapUpdate }) => {
  const [shouldReload, setShouldReload] = useState(false);
  const [mermaidCode, setMermaidCode] = useState(null);
  const [isRendering, setIsRendering] = useState(false);
  
  // 使用 ref 跟踪已扩展的节点，避免重复扩展
  const expandedNodesRef = useRef(new Set());
  // 跟踪上次扩展操作的时间戳，防止短时间内多次扩展
  const lastExpandTimeRef = useRef(0);
  // 跟踪当前正在处理的节点ID
  const processingNodeRef = useRef(null);
  
  // 添加日志：组件状态变化追踪
  useEffect(() => {
  }, [shouldReload, mermaidCode, isRendering, isProcessing, show, svgContent]);
  
  // 使用思维导图交互钩子，包含扩展功能
  const {
    lastClickedNode,
    expandCurrentNode,
    isExpanding,
    expandError,
    mindMapUpdated,
    resetMindMapUpdated
  } = useMindMapInteraction();
  
  // 监控 mindMapUpdated 状态变化
  useEffect(() => {
  }, [mindMapUpdated]);
  
  // 提取获取最新思维导图数据的函数
  const fetchLatestMindMapData = useCallback(() => {
    try {
      const mindMapData = localStorage.getItem('mindmap_data');
      
      if (mindMapData) {
        const parsedData = JSON.parse(mindMapData);
        if (parsedData && parsedData.code) {
          
          // 设置代码并强制进入渲染阶段
          setMermaidCode(parsedData.code);
          setIsRendering(true); // 立即触发渲染阶段
          
          // 添加短延迟后强制重置shouldReload，确保组件有足够时间渲染
          setTimeout(() => {
            setShouldReload(false);
          }, 100);
        } else {
          setShouldReload(false);
        }
      } else {
        setShouldReload(false);
      }
    } catch (error) {
      setShouldReload(false);
    }
  }, []);
  
  // 监听思维导图更新
  useEffect(() => {
    // 如果没有更新，直接返回
    if (!mindMapUpdated) return;
    
    // 设置重新加载标志
    setShouldReload(true);
    
    // 通知父组件
    if (onMindMapUpdate) {
      onMindMapUpdate();
    }
    
    // 重置更新标志
    resetMindMapUpdated();
    
    // 延迟获取最新数据
    const timer = setTimeout(() => {
      fetchLatestMindMapData();
      
      // 完成操作后，释放正在处理的节点引用
      processingNodeRef.current = null;
    }, 500);
    
    // 添加安全超时，防止永久加载
    const safetyTimer = setTimeout(() => {
      if (shouldReload) {
        setShouldReload(false);
        processingNodeRef.current = null;
      }
    }, 5000); // 5秒后强制重置
    
    // 添加额外安全检查
    const extraSafetyTimer = setTimeout(() => {
      
      if (shouldReload || isRendering) {
        setShouldReload(false);
        setIsRendering(false);
        setMermaidCode(null);
        processingNodeRef.current = null;
      }
    }, 10000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
      clearTimeout(extraSafetyTimer);
    };
  }, [mindMapUpdated, onMindMapUpdate, resetMindMapUpdated, shouldReload, fetchLatestMindMapData, mermaidCode, isRendering]);
  
  // 渲染开始回调
  const handleRenderStart = useCallback(() => {
    setIsRendering(true);
  }, []);
  
  // 修改渲染完成回调
  const handleRenderComplete = useCallback((renderedSvg, error) => {
    
    // 无论成功与否，都需要重置加载状态
    setIsRendering(false);
    setShouldReload(false);
    
    // 只有在成功时清除mermaidCode
    if (!error && renderedSvg) {
      setMermaidCode(null);
    } else if (error) {
    }
    
    // 完成渲染后，释放正在处理的节点引用
    processingNodeRef.current = null;
  }, []);
  
  // 处理节点扩展
  const handleExpandNode = useCallback(async () => {
    if (!lastClickedNode) {
      return;
    }
    
    const nodeId = lastClickedNode.id;
    
    // 检查是否已经在处理这个节点
    if (processingNodeRef.current === nodeId) {
      return;
    }
    
    // 检查节点是否已被扩展过
    if (expandedNodesRef.current.has(nodeId)) {
      return;
    }
    
    // 检查时间间隔，避免短时间内多次扩展
    const now = Date.now();
    if (now - lastExpandTimeRef.current < 1500) { // 至少1.5秒间隔
      return;
    }
    
    // 设置当前正在处理的节点
    processingNodeRef.current = nodeId;
    // 更新最后扩展时间
    lastExpandTimeRef.current = now;
    
    try {
      await expandCurrentNode();
      
      // 将节点标记为已扩展
      expandedNodesRef.current.add(nodeId);
      
      // 扩展成功后，直接获取最新数据并触发渲染
      setShouldReload(true);
      
      // 短延迟后直接获取数据
      setTimeout(() => {
        fetchLatestMindMapData();
      }, 500);
      
    } catch (error) {
      // 失败后重置处理状态
      processingNodeRef.current = null;
    }
  }, [lastClickedNode, expandCurrentNode, fetchLatestMindMapData]);
  
  // 监听 lastClickedNode 变化，自动触发扩展（优化版）
  useEffect(() => {
    // 确保有点击的节点，并且当前没有正在处理的操作
    if (lastClickedNode && 
        !isExpanding && 
        !shouldReload && 
        !isRendering && 
        !isProcessing &&
        processingNodeRef.current === null) {
      
      const nodeId = lastClickedNode.id;
      
      // 如果节点已经被扩展过，不再触发扩展
      if (expandedNodesRef.current.has(nodeId)) {
        return;
      }
      
      // 添加300ms的延迟，避免快速连续点击导致的反复渲染
      const timer = setTimeout(() => {
        handleExpandNode();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [lastClickedNode, isExpanding, shouldReload, isRendering, isProcessing, handleExpandNode]);

  // 当组件显示时，重置已扩展节点集合
  useEffect(() => {
    if (show) {
      expandedNodesRef.current = new Set();
    }
  }, [show]);

  // 确定是否显示加载状态
  const showLoading = isProcessing || shouldReload || isRendering || isExpanding;
  
  // 确定是否有内容可渲染
  const hasContent = mermaidCode || svgContent;
  
  // 添加显示状态日志
  useEffect(() => {
    if (show) {
    }
  }, [show, showLoading, hasContent, isProcessing, shouldReload, isRendering, isExpanding]);

  return (
    <Modal
      show={show}
      onClose={() => {
        onClose();
      }}
      title="思维导图"
    >
      <div className={styles.modalMindMapContent}>
        {/* 显示加载状态，但不阻止渲染组件 */}
        {showLoading && (
          <div className={styles.processingIndicator} style={{position: 'absolute', top: 0, left: 0, width: '100%', padding: '10px', zIndex: 100, backgroundColor: 'rgba(255,255,255,0.7)'}}>
            <i className="fas fa-spinner fa-spin"></i>
            {isExpanding ? "扩展节点中..." : 
             (shouldReload ? "重新加载思维导图..." : 
             (isRendering ? "渲染思维导图..." : "生成思维导图中..."))}
          </div>
        )}
        
        {/* 无论是否加载中，只要有内容或代码就渲染 */}
        {(mermaidCode || svgContent) ? (
          <div style={{position: 'relative', width: '100%', height: '100%'}}>
            <MindMapDisplay 
              key={mermaidCode ? `mc-${Date.now()}` : 'svg'} // 添加key强制重新渲染
              mermaidCode={mermaidCode}
              svgContent={!mermaidCode ? svgContent : null}
              isModal={true}
              isInteractive={true}
              onRenderStart={handleRenderStart}
              onRenderComplete={handleRenderComplete}
            />
          </div>
        ) : (
          <div className={styles.placeholder}>
            没有可用的思维导图内容
          </div>
        )}
      </div>
      
      {/* 保留错误信息显示 */}
      {expandError && (
        <div className={styles.expandError} style={{ margin: '10px 0', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px', color: '#d32f2f' }}>
          <i className="fas fa-exclamation-triangle"></i> {expandError}
        </div>
      )}
    </Modal>
  );
};

export default MindMapModal;