import React from 'react';
import styles from '../css/TranscriptDisplay.module.css';
import baseStyles from '../css/BaseStyles.module.css';
import progressStyles from '../css/ProgressSettings.module.css';

const FullTranscriptBox = ({ fullTranscript, wordCount, threshold = 200, onThresholdChange, isListening }) => {
  const transcriptRef = React.useRef(null);
  
  // 计算进度百分比
  const progressPercentage = Math.min(100, (wordCount / threshold) * 100);
  
  // 当文本更新时，自动滚动到底部
  React.useEffect(() => {
    if (transcriptRef.current) {
      // 确保滚动到底部
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [fullTranscript]);
  
  return (
    <div className={styles.fullTranscriptContainer} style={{ display: 'flex', flexDirection: 'column', flex: '1' }}>
      <div className={styles.transcriptHeader}>
        <div className={progressStyles.headerLeft}>
          <h3 className={baseStyles.subHeading}>Full Transcript</h3>
          <select 
            className={progressStyles.inlineSelect}
            value={threshold}
            onChange={onThresholdChange}
            disabled={isListening}
            title="Auto-optimize after this many words"
          >
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="150">150</option>
            <option value="200">200</option>
            <option value="250">250</option>
          </select>
        </div>
        
        <span className={progressStyles.wordCount}>
          Words: {wordCount}/{threshold} 
          <div className={progressStyles.progressBarContainer}>
            <div 
              className={progressStyles.progressBar} 
              style={{ 
                width: `${progressPercentage}%`,
                backgroundColor: progressPercentage > 90 ? '#4cc9f0' : '#4361ee'
              }}
            ></div>
          </div>
        </span>
      </div>
      <div
        ref={transcriptRef}
        className={styles.fullTranscript}
        style={{ flex: '1', minHeight: '150px' }}
      >
        {fullTranscript || "No transcript available yet. Start speaking to see your words here."}
      </div>
    </div>
  );
};

export default FullTranscriptBox;