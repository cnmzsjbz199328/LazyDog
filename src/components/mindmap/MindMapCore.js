import React, { useRef, useEffect } from 'react';
import styles from '../css/MindMap.module.css';

/**
 * MindMap 核心组件
 * 负责渲染思维导图
 */
const MindMapCore = ({ error, isProcessing, svgContent, onExpandClick }) => {
  const containerRef = useRef(null);

  // 更新容器中的 SVG 内容
  useEffect(() => {
    if (containerRef.current && svgContent) {
      containerRef.current.innerHTML = svgContent;
      
      // 调整 SVG 尺寸
      const svgElement = containerRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.style.width = '100%';
        svgElement.style.height = '100%';
      }
    }
  }, [svgContent]);

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>
        <i className="fas fa-project-diagram"></i> Mind Map
      </h2>
      
      {/* 放大按钮 */}
      <button 
        className={styles.expandButton} 
        onClick={onExpandClick}
        title="Expand Mind Map"
        aria-label="Expand Mind Map"
      >
        <i className="fas fa-expand-alt"></i>
      </button>
      
      {isProcessing && (
        <div className={styles.processingIndicator}>
          <i className="fas fa-spinner fa-spin"></i> Generating mind map...
        </div>
      )}
      
      {error && (
        <div className={styles.error}>
          <i className="fas fa-exclamation-triangle"></i> {error}
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className={styles.mindMapContent}
      >
        {!svgContent && !isProcessing && (
          <div className={styles.placeholder}>
            No mind map content available
          </div>
        )}
      </div>
    </div>
  );
};

export default MindMapCore;