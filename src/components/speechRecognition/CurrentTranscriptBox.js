import React, { useRef, useEffect } from 'react';
import styles from '../css/TranscriptDisplay.module.css';
import baseStyles from '../css/BaseStyles.module.css';

const CurrentTranscriptBox = ({ currentTranscript, transcriptKey }) => {
  const transcriptRef = useRef(null);
  
  // 当文本更新时，自动滚动到末尾
  useEffect(() => {
    if (transcriptRef.current && currentTranscript) {
      // 确保滚动到最右边，让光标可见
      transcriptRef.current.scrollLeft = transcriptRef.current.scrollWidth;
    }
  }, [currentTranscript, transcriptKey]);

  return (
    <div className={styles.currentTranscriptContainer}>
      <h3 className={baseStyles.subHeading}>Current Speech</h3>
      <div 
        ref={transcriptRef}
        className={`${styles.currentTranscript} ${currentTranscript ? styles.active : ''}`}
        key={transcriptKey} // 使用 key 来触发重新渲染和动画
      >
        <span className={styles.textWithCursor}>
          {currentTranscript || "No speech detected..."}
          {currentTranscript && <span className={styles.cursor}></span>}
        </span>
      </div>
    </div>
  );
};

export default CurrentTranscriptBox;