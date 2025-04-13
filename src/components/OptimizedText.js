import React, { useState } from 'react';
import styles from './css/OptimizedText.module.css';

function OptimizedText({ optimizedText }) {
  const [activeTab, setActiveTab] = useState('content');
  const [copySuccess, setCopySuccess] = useState(false);
  const [thumbsUp, setThumbsUp] = useState(false);
  
  let parsedContent = null;
  try {
    if (optimizedText) {
      parsedContent = JSON.parse(optimizedText);
    }
  } catch (e) {
    console.error('Error parsing optimized text:', e);
  }
  
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };
  
  const handleThumbsUp = () => {
    setThumbsUp(true);
    setTimeout(() => setThumbsUp(false), 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.cardHeader}>
        <div className={styles.iconWrapper}>
          <i className="fas fa-file-alt"></i>
        </div>
        <h2>Optimized Results</h2>
      </div>
      
      <div className={styles.cardBody}>
        <div className={styles.tabs}>
          <div 
            className={`${styles.tab} ${activeTab === 'content' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('content')}
          >
            Content
          </div>
          <div 
            className={`${styles.tab} ${activeTab === 'main' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('main')}
          >
            Key Points
          </div>
        </div>
        
        {activeTab === 'content' && (
          <div className={styles.tabContent}>
            <div className={styles.optimizedContent}>
              {parsedContent ? parsedContent.content : ''}
              <button 
                className={styles.copyButton}
                onClick={() => parsedContent && handleCopy(parsedContent.content)}
              >
                <i className={`fas ${copySuccess ? 'fa-check' : 'fa-copy'}`}></i>
              </button>
            </div>
            
            <div className={styles.thumbsUp} onClick={handleThumbsUp}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={thumbsUp ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              </svg>
            </div>
          </div>
        )}
        
        {activeTab === 'main' && (
          <div className={styles.tabContent}>
            <div className={styles.optimizedContent}>
              {parsedContent ? parsedContent.mainPoint : ''}
              <button 
                className={styles.copyButton}
                onClick={() => parsedContent && handleCopy(parsedContent.mainPoint)}
              >
                <i className={`fas ${copySuccess ? 'fa-check' : 'fa-copy'}`}></i>
              </button>
            </div>
          </div>
        )}
        
        {/* 删除 mindMapSection 部分的代码 */}
      </div>
    </div>
  );
}

export default OptimizedText;