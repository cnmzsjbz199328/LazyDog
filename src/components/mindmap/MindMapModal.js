import React, { useRef, useEffect } from 'react';
import Modal from '../Modal';
import styles from '../css/MindMap.module.css';
import { adjustSvgSize } from './utils/svgUtils';

/**
 * 思维导图模态框组件
 */
const MindMapModal = ({ show, onClose, svgContent, isProcessing }) => {
  const modalContentRef = useRef(null);

  // 控制模态框打开时阻止页面滚动
  useEffect(() => {
    if (show) {
      // 当模态框打开时，阻止背景页面滚动
      document.body.style.overflow = 'hidden';
    } else {
      // 当模态框关闭时，恢复页面滚动
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      // 组件卸载时恢复滚动
      document.body.style.overflow = 'auto';
    };
  }, [show]);

  // 在模态框显示时复制 SVG 内容
  useEffect(() => {
    if (show && modalContentRef.current && svgContent) {
      // 延迟一小段时间以确保 DOM 稳定
      const timer = setTimeout(() => {
        // 直接复制当前 SVG 内容
        modalContentRef.current.innerHTML = svgContent;
        
        // 调整模态框中 SVG 的尺寸
        const modalSvg = modalContentRef.current.querySelector('svg');
        if (modalSvg) {
          adjustSvgSize(modalSvg, true);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [show, svgContent]);

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
    </Modal>
  );
};

export default MindMapModal;