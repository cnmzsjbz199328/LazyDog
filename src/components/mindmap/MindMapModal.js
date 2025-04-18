import React, { useRef, useEffect, useState } from 'react';
import Modal from '../Modal';
import NodeInfoPanel from './components/NodeInfoPanel';
import { useMindMapInteraction } from './hooks/useMindMapInteraction';
import { useMindMapRenderer } from './hooks/useMindMapRenderer';
import styles from '../css/MindMap.module.css';

/**
 * 思维导图模态框组件
 */
const MindMapModal = ({ show, onClose, svgContent, isProcessing, onMindMapUpdate }) => {
  const modalContentRef = useRef(null);
  const [shouldReload, setShouldReload] = useState(false);
  
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

  // 使用渲染钩子处理SVG渲染
  useMindMapRenderer({
    show,
    svgContent, 
    containerRef: modalContentRef,
    isProcessing: isProcessing || shouldReload,
  });
  
  // 监听思维导图更新
  useEffect(() => {
    if (mindMapUpdated) {
      // 通知父组件思维导图已更新
      if (onMindMapUpdate) {
        onMindMapUpdate();
      }
      
      // 设置重新加载标志，会触发重新渲染
      setShouldReload(true);
      
      // 重置更新标志
      resetMindMapUpdated();
      
      // 1秒后重置加载标志
      const timer = setTimeout(() => {
        setShouldReload(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [mindMapUpdated, onMindMapUpdate, resetMindMapUpdated]);

  // 处理节点扩展
  const handleExpandNode = async () => {
    await expandCurrentNode();
  };

  return (
    <Modal
      show={show}
      onClose={onClose}
      title="Mind Map"
    >
      <div 
        ref={modalContentRef}
        className={styles.modalMindMapContent}
      >
        {(isProcessing || shouldReload) && (
          <div className={styles.processingIndicator}>
            <i className="fas fa-spinner fa-spin"></i>
            {shouldReload ? "重新加载思维导图..." : "生成思维导图中..."}
          </div>
        )}
        
        {!svgContent && !isProcessing && !shouldReload && (
          <div className={styles.placeholder}>
            没有可用的思维导图内容
          </div>
        )}
      </div>
      
      {/* 节点信息面板 */}
      {lastClickedNode && (
        <NodeInfoPanel 
          nodeText={lastClickedNode.text}
          relatedRecords={relatedRecords}
        />
      )}
      
      {/* 扩展按钮 */}
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
              disabled={isExpanding || shouldReload}
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