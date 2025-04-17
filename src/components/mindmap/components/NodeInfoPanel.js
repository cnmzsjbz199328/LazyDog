import React from 'react';
import styles from '../../css/MindMap.module.css';

/**
 * 节点信息面板组件
 * 显示选中节点信息和相关记录
 */
const NodeInfoPanel = ({ nodeText, relatedRecords }) => {
  return (
    <div className={styles.nodeInfoPanel}>
      <h4>Selected Node: {nodeText}</h4>
      
      {relatedRecords.length > 0 ? (
        <div className={styles.relatedRecords}>
          <h5>Related Records ({relatedRecords.length}):</h5>
          <div className={styles.recordsList}>
            {relatedRecords.map((record, index) => (
              <div key={index} className={styles.recordItem}>
                <div className={styles.recordMainPoint}>{record.mainPoint}</div>
                <div className={styles.recordContent}>{record.content}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className={styles.noRecords}>
          No directly related records found for this topic.
        </p>
      )}
    </div>
  );
};

export default NodeInfoPanel;