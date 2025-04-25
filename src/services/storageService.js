import { STORAGE_CONFIG } from '../config/storageConfig';

/**
 * 统一存储服务 - 管理所有localStorage操作
 */
class StorageService {
  // ==================== 背景信息 ====================
  getBackgroundInfo() {
    return localStorage.getItem(STORAGE_CONFIG.KEYS.BACKGROUND) || '';
  }
  
  setBackgroundInfo(value) {
    if (value) {
      localStorage.setItem(STORAGE_CONFIG.KEYS.BACKGROUND, value);
    } else {
      localStorage.removeItem(STORAGE_CONFIG.KEYS.BACKGROUND);
    }
    this._dispatchStorageEvent(STORAGE_CONFIG.KEYS.BACKGROUND, 'updated');
    return true;
  }
  
  // ==================== 历史记录 ====================
  getHistoryPoints() {
    try {
      const apiResponse = localStorage.getItem(STORAGE_CONFIG.KEYS.HISTORY);
      if (!apiResponse) return [];
      
      const historyRecords = JSON.parse(apiResponse);
      if (!Array.isArray(historyRecords)) return [];
      
      return historyRecords
        .filter(record => this._isValidRecord(record))
        .map(record => record.mainPoint);
    } catch (err) {
      console.error('获取历史记录失败:', err);
      return [];
    }
  }
  
  getHistoryRecords() {
    try {
      const apiResponse = localStorage.getItem(STORAGE_CONFIG.KEYS.HISTORY);
      if (!apiResponse) return [];
      
      const records = JSON.parse(apiResponse);
      return Array.isArray(records) ? records : [];
    } catch (err) {
      console.error('获取历史记录失败:', err);
      return [];
    }
  }
  
  saveHistoryRecord(data) {
    try {
      // 获取现有记录
      const records = this.getHistoryRecords();
      
      // 解析新数据
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      
      // 验证数据有效性
      if (!this._isValidRecord(parsedData)) {
        console.warn('尝试保存无效记录，已忽略');
        return false;
      }
      
      // 添加记录并保存
      records.push(parsedData);
      localStorage.setItem(STORAGE_CONFIG.KEYS.HISTORY, JSON.stringify(records));
      
      // 触发事件通知
      this._dispatchStorageEvent(STORAGE_CONFIG.KEYS.HISTORY, 'added');
      return true;
    } catch (err) {
      console.error('保存历史记录失败:', err);
      return false;
    }
  }
  
  clearHistoryRecords() {
    localStorage.removeItem(STORAGE_CONFIG.KEYS.HISTORY);
    this._dispatchStorageEvent(STORAGE_CONFIG.KEYS.HISTORY, 'cleared');
    return true;
  }
  
  cleanInvalidRecords() {
    try {
      const records = this.getHistoryRecords();
      if (!records || !records.length) return 0;
      
      const originalLength = records.length;
      const validRecords = records.filter(record => this._isValidRecord(record));
      
      if (validRecords.length !== originalLength) {
        localStorage.setItem(STORAGE_CONFIG.KEYS.HISTORY, JSON.stringify(validRecords));
        this._dispatchStorageEvent(STORAGE_CONFIG.KEYS.HISTORY, 'cleaned');
        return originalLength - validRecords.length;
      }
      return 0;
    } catch (err) {
      console.error('清理无效记录失败:', err);
      return 0;
    }
  }
  
  // ==================== 思维导图缓存 ====================
  getMindMapCache(content, mainPoint) {
    try {
      const cacheKey = this._generateCacheKey(content, mainPoint);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const cachedData = JSON.parse(cached);
      const cacheTime = new Date(cachedData.timestamp);
      const now = new Date();
      const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);
      
      if (hoursDiff < STORAGE_CONFIG.CACHE.EXPIRY_HOURS) {
        console.log("Using cached mind map data");
        return cachedData.mindMapCode;
      }
      return null;
    } catch (err) {
      console.error('获取思维导图缓存失败:', err);
      return null;
    }
  }
  
  saveMindMapCache(content, mainPoint, mindMapCode) {
    try {
      // 如果禁用缓存，则跳过
      if (!STORAGE_CONFIG.CACHE.ENABLED) return false;
      
      const cacheKey = this._generateCacheKey(content, mainPoint);
      const cacheData = {
        mindMapCode,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      return true;
    } catch (err) {
      console.error('保存思维导图缓存失败:', err);
      return false;
    }
  }
  
  // ==================== 思维导图数据 ====================
  saveMindMapData(data) {
    try {
      localStorage.setItem(STORAGE_CONFIG.KEYS.MIND_MAP, JSON.stringify(data));
      this._dispatchStorageEvent(STORAGE_CONFIG.KEYS.MIND_MAP, 'saved');
      return true;
    } catch (err) {
      console.error('保存思维导图数据失败:', err);
      return false;
    }
  }
  
  getMindMapData() {
    try {
      const data = localStorage.getItem(STORAGE_CONFIG.KEYS.MIND_MAP);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('获取思维导图数据失败:', err);
      return null;
    }
  }
  
  // ==================== 节点展开缓存 ====================
  getNodeExpansionCache(nodeId) {
    try {
      const cacheKey = `${STORAGE_CONFIG.KEYS.NODE_EXPANSION_PREFIX}${nodeId}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const cachedData = JSON.parse(cached);
      const cacheTime = new Date(cachedData.timestamp);
      const now = new Date();
      const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);
      
      if (hoursDiff < STORAGE_CONFIG.CACHE.EXPIRY_HOURS) {
        console.log(`Using cached node expansion for ${nodeId}`);
        return cachedData;
      }
      return null;
    } catch (err) {
      console.error('获取节点展开缓存失败:', err);
      return null;
    }
  }
  
  saveNodeExpansionCache(nodeId, childNodes) {
    try {
      // 如果禁用缓存，则跳过
      if (!STORAGE_CONFIG.CACHE.ENABLED) return false;
      
      const cacheKey = `${STORAGE_CONFIG.KEYS.NODE_EXPANSION_PREFIX}${nodeId}`;
      const cacheData = {
        childNodes,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      return true;
    } catch (err) {
      console.error('保存节点展开缓存失败:', err);
      return false;
    }
  }
  
  // ==================== 通用方法 ====================
  clearAllCaches() {
    try {
      // 清除所有以缓存前缀开头的项
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(STORAGE_CONFIG.KEYS.MIND_MAP_CACHE_PREFIX) || 
            key.startsWith(STORAGE_CONFIG.KEYS.NODE_EXPANSION_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log(`清除了 ${keysToRemove.length} 个缓存项`);
      return keysToRemove.length;
    } catch (err) {
      console.error('清除缓存失败:', err);
      return 0;
    }
  }
  
  // ==================== 私有辅助方法 ====================
  _generateCacheKey(content, mainPoint) {
    return `${STORAGE_CONFIG.KEYS.MIND_MAP_CACHE_PREFIX}${
      btoa(content.slice(0, 100) + mainPoint).replace(/=/g, '')
    }`;
  }
  
  _dispatchStorageEvent(storageKey, action) {
    if (!STORAGE_CONFIG.EVENTS.DISPATCH_EVENTS) return;
    
    const event = new CustomEvent(STORAGE_CONFIG.EVENTS.UPDATE_EVENT_NAME, {
      detail: { storageKey, action }
    });
    window.dispatchEvent(event);
  }
  
  _isValidRecord(record) {
    // 检查是否存在必要字段
    if (!record || !record.mainPoint || !record.content) return false;
    
    // 检查字段是否为空
    if (record.mainPoint.trim() === '' || record.content.trim() === '') return false;
    
    // 检查是否为无效值
    const invalidMainPoints = STORAGE_CONFIG.VALIDATION.INVALID_MAIN_POINTS;
    const invalidContents = STORAGE_CONFIG.VALIDATION.INVALID_CONTENTS;
    
    if (invalidMainPoints.includes(record.mainPoint)) return false;
    if (invalidContents.includes(record.content)) return false;
    
    return true;
  }
}

// 导出单例
export const storageService = new StorageService();