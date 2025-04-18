import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../Modal';
import NodeInfoPanel from './components/NodeInfoPanel';
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
  
  // 添加日志：组件状态变化追踪
  useEffect(() => {
    console.log('🔍 MindMapModal 状态:', { 
      shouldReload, 
      hasMermaidCode: !!mermaidCode, 
      isRendering,
      isProcessing, 
      show,
      hasSvgContent: !!svgContent
    });
  }, [shouldReload, mermaidCode, isRendering, isProcessing, show, svgContent]);
  
  // 使用思维导图交互钩子，包含扩展功能
  const {
    lastClickedNode,
    relatedRecords,
    expandCurrentNode,
    isExpanding,
    expandError,
    mindMapUpdated,
    resetMindMapUpdated
  } = useMindMapInteraction();
  
  // 监控 mindMapUpdated 状态变化
  useEffect(() => {
    console.log('🔄 mindMapUpdated 状态变化:', mindMapUpdated);
  }, [mindMapUpdated]);
  
  // 提取获取最新思维导图数据的函数
  const fetchLatestMindMapData = useCallback(() => {
    console.log('📥 开始获取最新思维导图数据');
    try {
      const mindMapData = localStorage.getItem('mindmap_data');
      console.log('📦 localStorage 中的数据:', mindMapData ? '有数据' : '无数据');
      
      if (mindMapData) {
        const parsedData = JSON.parse(mindMapData);
        if (parsedData && parsedData.code) {
          console.log('✅ 成功获取到更新后的思维导图代码，长度:', parsedData.code.length);
          console.log('💡 代码前40个字符:', parsedData.code.substring(0, 40) + '...');
          
          // 设置代码并强制进入渲染阶段
          setMermaidCode(parsedData.code);
          setIsRendering(true); // 立即触发渲染阶段
          
          // 添加短延迟后强制重置shouldReload，确保组件有足够时间渲染
          setTimeout(() => {
            console.log('🔄 强制重置加载状态，允许渲染组件显示');
            setShouldReload(false);
          }, 100);
        } else {
          console.warn('⚠️ 思维导图数据不完整');
          setShouldReload(false);
        }
      } else {
        console.warn('⚠️ 未找到思维导图数据');
        setShouldReload(false);
      }
    } catch (error) {
      console.error('❌ 获取思维导图数据失败:', error);
      setShouldReload(false);
    }
  }, []);
  
  // 监听思维导图更新
  useEffect(() => {
    // 如果没有更新，直接返回
    if (!mindMapUpdated) return;
    
    console.log('🔔 思维导图已更新，准备获取新数据');
    
    // 设置重新加载标志
    setShouldReload(true);
    
    // 通知父组件
    if (onMindMapUpdate) {
      console.log('📣 通知父组件思维导图已更新');
      onMindMapUpdate();
    }
    
    // 重置更新标志
    console.log('🔄 重置 mindMapUpdated 标志');
    resetMindMapUpdated();
    
    // 延迟获取最新数据
    console.log('⏱️ 设置500ms延迟后获取最新数据');
    const timer = setTimeout(() => {
      console.log('⏱️ 500ms延迟结束，开始获取数据');
      fetchLatestMindMapData();
    }, 500);
    
    // 添加安全超时，防止永久加载
    console.log('⏱️ 设置5秒安全超时');
    const safetyTimer = setTimeout(() => {
      if (shouldReload) {
        console.log('⚠️ 渲染超时(5秒)，强制重置状态');
        setShouldReload(false);
      } else {
        console.log('✅ 安全超时检查：状态已正常重置');
      }
    }, 5000); // 5秒后强制重置
    
    // 添加额外安全检查
    const extraSafetyTimer = setTimeout(() => {
      console.log('🔍 10秒额外安全检查 - 当前状态:', { 
        shouldReload, 
        hasMermaidCode: !!mermaidCode, 
        isRendering 
      });
      
      if (shouldReload || isRendering) {
        console.log('⚠️ 检测到长时间(10秒)未完成渲染，强制重置所有状态');
        setShouldReload(false);
        setIsRendering(false);
        setMermaidCode(null);
      }
    }, 10000);
    
    return () => {
      console.log('♻️ 清除所有定时器');
      clearTimeout(timer);
      clearTimeout(safetyTimer);
      clearTimeout(extraSafetyTimer);
    };
  }, [mindMapUpdated, onMindMapUpdate, resetMindMapUpdated, shouldReload, fetchLatestMindMapData, mermaidCode, isRendering]);
  
  // 渲染开始回调
  const handleRenderStart = useCallback(() => {
    console.log('🎬 开始渲染思维导图');
    setIsRendering(true);
  }, []);
  
  // 修改渲染完成回调
  const handleRenderComplete = useCallback((renderedSvg, error) => {
    console.log('🏁 思维导图渲染完成', error ? '但有错误' : '成功');
    console.log('📊 渲染结果:', {
      svgLength: renderedSvg ? renderedSvg.length : 0,
      hasError: !!error,
      errorMessage: error ? error.message : null
    });
    
    // 无论成功与否，都需要重置加载状态
    setIsRendering(false);
    setShouldReload(false);
    
    // 只有在成功时清除mermaidCode
    if (!error && renderedSvg) {
      console.log('🧹 渲染成功，清除mermaidCode');
      setMermaidCode(null);
    } else if (error) {
      console.error('❌ 渲染出错:', error);
    }
  }, []);
  
  // 处理节点扩展
  const handleExpandNode = async () => {
    if (!lastClickedNode) {
      console.warn('⚠️ 无法扩展：未选择节点');
      return;
    }
    
    console.log('✨ 开始扩展节点:', lastClickedNode.text);
    try {
      await expandCurrentNode();
      console.log('✅ 节点扩展请求完成');
      
      // 扩展成功后，直接获取最新数据并触发渲染
      console.log('🔄 节点扩展成功，直接获取最新数据');
      setShouldReload(true);
      
      // 短延迟后直接获取数据
      setTimeout(() => {
        fetchLatestMindMapData();
      }, 300);
      
    } catch (error) {
      console.error('❌ 节点扩展失败:', error);
    }
  };

  // 确定是否显示加载状态
  const showLoading = isProcessing || shouldReload || isRendering;
  
  // 确定是否有内容可渲染
  const hasContent = mermaidCode || svgContent;
  
  // 添加显示状态日志
  useEffect(() => {
    if (show) {
      console.log('🔵 模态框显示状态:', {
        showLoading,
        hasContent,
        loadingReason: showLoading ? 
          (isProcessing ? 'isProcessing' : 
          (shouldReload ? 'shouldReload' : 
          (isRendering ? 'isRendering' : 'unknown'))) : 'none'
      });
    }
  }, [show, showLoading, hasContent, isProcessing, shouldReload, isRendering]);

  return (
    <Modal
      show={show}
      onClose={() => {
        console.log('🚪 关闭模态框');
        onClose();
      }}
      title="思维导图"
    >
      <div className={styles.modalMindMapContent}>
        {/* 显示加载状态，但不阻止渲染组件 */}
        {showLoading && (
          <div className={styles.processingIndicator} style={{position: 'absolute', top: 0, left: 0, width: '100%', padding: '10px', zIndex: 100, backgroundColor: 'rgba(255,255,255,0.7)'}}>
            <i className="fas fa-spinner fa-spin"></i>
            {shouldReload ? "重新加载思维导图..." : (isRendering ? "渲染思维导图..." : "生成思维导图中...")}
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
      
      {/* 其余代码保持不变 */}
      {lastClickedNode && (
        <NodeInfoPanel 
          nodeText={lastClickedNode.text}
          relatedRecords={relatedRecords}
        />
      )}
      
      {lastClickedNode && (
        <div className={styles.nodeExpanderContainer}>
          <h4 className={styles.expanderTitle}>
            <i className="fas fa-project-diagram"></i> 节点扩展
          </h4>
          <div className={styles.selectedNodeInfo}>
            <p>已选择节点: <strong>{lastClickedNode.text}</strong></p>
            <button 
              className={styles.expandButton}
              onClick={handleExpandNode}
              disabled={isExpanding || showLoading}
            >
              {isExpanding ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> 正在扩展...
                </>
              ) : (
                <>
                  <i className="fas fa-plus-circle"></i> 扩展节点
                </>
              )}
            </button>
          </div>
          
          {expandError && (
            <div className={styles.expandError}>
              <i className="fas fa-exclamation-triangle"></i> {expandError}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default MindMapModal;