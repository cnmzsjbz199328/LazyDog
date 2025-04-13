import React, { useEffect, useState } from 'react';
import styles from './css/ContentDisplay.module.css';
import { cleanStorageContent } from '../utils/write';

const ContentDisplay = () => {
  const [data, setData] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);

  // 加载和过滤数据函数，同时执行自动清理
  const loadAndFilterData = () => {
    // 1. 首先执行自动清理操作
    const removedCount = cleanStorageContent();
    if (removedCount > 0) {
      console.log(`自动清理了 ${removedCount} 条无效记录`);
    }

    // 2. 然后加载已清理的数据
    const storedData = localStorage.getItem('apiResponse');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        
        if (Array.isArray(parsedData)) {
          // 过滤无效数据 (二次保险)
          const filteredData = parsedData.filter(item => 
            item && 
            item.mainPoint && 
            item.content && 
            item.mainPoint.trim() !== '' &&
            item.content.trim() !== '' &&
            item.mainPoint !== 'Mind Map' &&
            item.content !== 'No Content' &&
            item.mainPoint !== 'No main point'
          );
          
          setData(filteredData);
        } else {
          // 如果是单个对象，也进行验证
          if (parsedData && parsedData.mainPoint && parsedData.content && 
              parsedData.mainPoint !== 'Mind Map' && 
              parsedData.content !== 'No Content') {
            setData([parsedData]);
          } else {
            setData([]);
          }
        }
      } catch (error) {
        console.error('Error parsing JSON from localStorage:', error);
        setData([]);
      }
    }
  };

  useEffect(() => {
    // 初始加载
    loadAndFilterData();
    
    // 添加监听器，当localStorage更新时重新加载数据
    const handleStorageUpdate = (event) => {
      // 只有在apiResponse更新时才重新加载
      if (event.detail.storageKey === 'apiResponse') {
        console.log('History records: Detected localStorage update, reloading data');
        loadAndFilterData();
      }
    };
    
    // 监听自定义事件
    window.addEventListener('localStorageUpdated', handleStorageUpdate);
    
    // 添加自动定期清理逻辑 - 每10分钟自动检查一次
    const autoCleanInterval = setInterval(() => {
      const cleanedCount = cleanStorageContent();
      if (cleanedCount > 0) {
        console.log(`自动清理了 ${cleanedCount} 条无效记录`);
        loadAndFilterData(); // 重新加载数据
      }
    }, 10 * 60 * 1000);
    
    // 组件卸载时移除事件监听器和定时器
    return () => {
      window.removeEventListener('localStorageUpdated', handleStorageUpdate);
      clearInterval(autoCleanInterval);
    };
  }, []);

  const handleToggle = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleClearStorage = () => {
    if (window.confirm('Are you sure you want to clear all history records?')) {
      localStorage.clear();
      setData([]);
      setExpandedIndex(null);
      console.log('localStorage has been cleared');
    }
  };

  // 添加导出功能
  const handleExport = () => {
    if (data.length === 0) {
      alert('No history records to export.');
      return;
    }

    // 格式化数据为可读的文本
    const formattedData = data.map((item, index) => {
      const mainPoint = item.mainPoint || 'Untitled';
      const content = item.content || 'No content available';
      return `--- Record ${index + 1} ---\n\nMain Point: ${mainPoint}\n\nContent: ${content}\n\n`;
    }).join('\n');

    // 创建文件内容
    const fileContent = `History Records Export - ${new Date().toLocaleString()}\n\n${formattedData}`;
    
    // 创建blob对象
    const blob = new Blob([fileContent], { type: 'text/plain' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `history-records-${new Date().toISOString().slice(0,10)}.txt`;
    
    // 触发下载
    document.body.appendChild(a);
    a.click();
    
    // 清理
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    console.log('Export completed');
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>
        <i className="fas fa-history"></i> History Records
        {/* 可选：添加一个小指示器，显示最后更新时间 */}
        <small className={styles.updateIndicator}>
          {data.length > 0 && <span>Last updated: {new Date().toLocaleTimeString()}</span>}
        </small>
      </h2>
      
      <div className={styles.toolbar}>
        {/* 删除"Clean Invalid"按钮，仅保留其他功能按钮 */}
        <button 
          className={styles.exportButton} 
          onClick={handleExport} 
          disabled={data.length === 0}
        >
          <i className="fas fa-download"></i> Export Records
        </button>
        
        <button 
          className={styles.clearButton} 
          onClick={handleClearStorage}
        >
          <i className="fas fa-trash"></i> Clear History
        </button>
      </div>
      
      {data.length === 0 ? (
        <p className={styles.noContent}>No history records</p>
      ) : (
        <ul className={styles.list}>
          {data.map((item, index) => (
            <li key={index} className={styles.item}>
              <div
                className={`${styles.mainPoint} ${expandedIndex === index ? styles.expanded : ''}`}
                onClick={() => handleToggle(index)}
              >
                <i className={`fas ${expandedIndex === index ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
                {item.mainPoint || 'Untitled'}
              </div>
              {expandedIndex === index && (
                <div className={styles.content}>
                  <p>{item.content || 'No content available'}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ContentDisplay;