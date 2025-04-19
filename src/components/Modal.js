import React from 'react';
import ReactDOM from 'react-dom';
import styles from './css/Modal.module.css';

/**
 * Reusable modal component - renders with Portal in document.body
 * @param {boolean} show - Whether to show the modal
 * @param {function} onClose - Callback function to close the modal
 * @param {string} title - Modal title
 * @param {ReactNode} children - Modal content
 * @param {string} className - Additional style class names
 * @param {ReactNode} extraButtons - Additional buttons to display in header
 */
const Modal = ({ show, onClose, title, children, className, extraButtons }) => {
  if (!show) return null;

  // Prevent closing when clicking content area
  const handleContentClick = (e) => {
    e.stopPropagation();
  };
  
  // Use Portal to render modal to document.body
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
          <div className={styles.modalControls}>
            {extraButtons}
            <button className={styles.closeButton} onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
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