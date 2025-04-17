import React, { useRef } from 'react';
import Modal from '../Modal';
import styles from '../css/MindMap.module.css';
import NodeInfoPanel from './components/NodeInfoPanel';
import { useMindMapInteraction } from './hooks/useMindMapInteraction';
import { useMindMapRenderer } from './hooks/useMindMapRenderer';

/**
 * 思维导图模态框组件
 */
const MindMapModal = ({ show, onClose, svgContent, isProcessing }) => {
  const modalContentRef = useRef(null);
  
  // 使用单一钩子处理所有交互和数据逻辑
  const {
    lastClickedNode,
    relatedRecords,
    handleNodeClick
  } = useMindMapInteraction();

  // 使用渲染钩子处理SVG渲染
  useMindMapRenderer({
    show,
    svgContent, 
    containerRef: modalContentRef,
    isProcessing,
    onNodeClick: handleNodeClick
  });
  
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
        {isProcessing ? (
          <div className={styles.processingIndicator}>
            <i className="fas fa-spinner fa-spin"></i> Generating mind map...
          </div>
        ) : !svgContent && (
          <div className={styles.placeholder}>
            No mind map content available
          </div>
        )}
      </div>
      
      {lastClickedNode && (
        <NodeInfoPanel 
          nodeText={lastClickedNode.text}
          relatedRecords={relatedRecords}
        />
      )}
    </Modal>
  );
};

export default MindMapModal;