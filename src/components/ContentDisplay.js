import React, { useEffect, useState } from 'react';
import styles from './css/ContentDisplay.module.css';
import { storageService } from '../services/storageService'; // 修改导入
import { STORAGE_CONFIG } from '../config/storageConfig'; // 添加导入

const ContentDisplay = () => {
  const [data, setData] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);

  // 加载数据函数
  const loadAndFilterData = () => {
    // 使用 storageService 获取历史记录
    const records = storageService.getHistoryRecords();
    setData(records);
  };

  useEffect(() => {
    // 初始加载
    loadAndFilterData();
    
    // 添加定期自动清理
    const autoCleanInterval = setInterval(() => {
      const cleanedCount = storageService.cleanInvalidRecords(); // 使用服务清理
      if (cleanedCount > 0) {
        console.log(`自动清理了 ${cleanedCount} 条无效记录`);
        loadAndFilterData(); // 重新加载数据
      }
    }, 10 * 60 * 1000);
    
    // 添加事件监听器
    const handleStorageUpdate = (event) => {
      if (event.detail.storageKey === STORAGE_CONFIG.KEYS.HISTORY) {
        console.log('History records: Detected localStorage update, reloading data');
        loadAndFilterData();
      }
    };
    
    window.addEventListener(STORAGE_CONFIG.EVENTS.UPDATE_EVENT_NAME, handleStorageUpdate);
    
    return () => {
      clearInterval(autoCleanInterval);
      window.removeEventListener(STORAGE_CONFIG.EVENTS.UPDATE_EVENT_NAME, handleStorageUpdate);
    };
  }, []);

  const handleToggle = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleClearStorage = () => {
    if (window.confirm('Are you sure you want to clear all history records?')) {
      // 使用服务清除历史记录
      storageService.clearHistoryRecords();
      setData([]);
      setExpandedIndex(null);
      console.log('History records have been cleared');
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
        <i className="fas fa-history"></i> Records
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
                  {/* 使用适当的文本处理确保长内容能正确显示 */}
                  <p style={{wordBreak: 'break-word'}}>{item.content || 'No content available'}</p>
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