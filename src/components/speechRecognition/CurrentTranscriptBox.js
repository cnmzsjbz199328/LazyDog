import React, { useRef, useEffect } from 'react';
import styles from '../css/CurrentSpeech.module.css';
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

  // 准备显示文本
  const displayText = currentTranscript || "No speech detected...";

  return (
    <div className={styles.container}>
      <h3 className={baseStyles.subHeading}>Current Speech</h3>
      <div 
        ref={transcriptRef}
        className={`${styles.transcript} ${currentTranscript ? styles.active : ''}`}
        key={transcriptKey}
      >
        <span className={styles.textContent}>
          {displayText}
          {currentTranscript && <span className={styles.cursor}></span>}
        </span>
      </div>
    </div>
  );
};

export default CurrentTranscriptBox;