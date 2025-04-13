import React from 'react';
import ReactDOM from 'react-dom';
import styles from './css/Modal.module.css';

/**
 * 可重用的模态框组件 - 使用 Portal 在 document.body 上渲染
 * @param {boolean} show - 是否显示模态框
 * @param {function} onClose - 关闭模态框的回调函数
 * @param {string} title - 模态框标题
 * @param {ReactNode} children - 模态框内容
 * @param {string} className - 额外的样式类名
 */
const Modal = ({ show, onClose, title, children, className }) => {
  if (!show) return null;

  // 阻止点击内容区域时触发关闭
  const handleContentClick = (e) => {
    e.stopPropagation();
  };
  
  // 使用 Portal 将模态框渲染到 document.body
  return ReactDOM.createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={`${styles.modal} ${className || ''}`} 
        onClick={handleContentClick}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <i className="fas fa-project-diagram"></i> {title}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className={styles.modalContent}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;