export const saveContentToLocalStorage = (data, storageKey = 'apiResponse') => {
    // 从 localStorage 获取现有数据
    const existingData = localStorage.getItem(storageKey);
    let dataArray = existingData ? JSON.parse(existingData) : [];
  
    // 确保 dataArray 是数组
    if (!Array.isArray(dataArray)) {
      dataArray = [];
    }

    try {
      // 将新数据解析为对象
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      
      // 验证数据的有效性
      if (!parsedData || 
          !parsedData.mainPoint || 
          !parsedData.content || 
          parsedData.mainPoint.trim() === '' ||
          parsedData.content.trim() === '' ||
          parsedData.mainPoint === 'Mind Map' ||
          parsedData.content === 'No Content' ||
          parsedData.mainPoint === 'No main point') {
        console.warn('Invalid data detected, not saving to localStorage:', parsedData);
        return false;
      }
      
      // 追加到数组并保存
      dataArray.push(parsedData);
      localStorage.setItem(storageKey, JSON.stringify(dataArray));
      
      // 触发自定义事件，通知其他组件数据已更新
      const event = new CustomEvent('localStorageUpdated', {
        detail: { storageKey, action: 'added' }
      });
      window.dispatchEvent(event);
      
      return true;
    } catch (err) {
      console.error('Failed to save content to localStorage:', err);
      return false;
    }
};

// 添加一个新函数，清理现有的存储数据
export const cleanStorageContent = (storageKey = 'apiResponse') => {
  try {
    const existingData = localStorage.getItem(storageKey);
    if (!existingData) return 0;
    
    const dataArray = JSON.parse(existingData);
    if (!Array.isArray(dataArray)) return 0;
    
    const originalLength = dataArray.length;
    
    // 过滤无效数据
    const cleanedArray = dataArray.filter(item => 
      item && 
      item.mainPoint && 
      item.content && 
      item.mainPoint.trim() !== '' &&
      item.content.trim() !== '' &&
      item.mainPoint !== 'Mind Map' &&
      item.content !== 'No Content' &&
      item.mainPoint !== 'No main point'
    );
    
    // 只有在有变化时才保存
    if (cleanedArray.length !== originalLength) {
      localStorage.setItem(storageKey, JSON.stringify(cleanedArray));
      
      // 触发自定义事件，通知其他组件数据已清理
      const event = new CustomEvent('localStorageUpdated', {
        detail: { storageKey, action: 'cleaned' }
      });
      window.dispatchEvent(event);
      
      return originalLength - cleanedArray.length; // 返回删除的记录数
    }
    
    return 0;
  } catch (error) {
    console.error('Failed to clean storage content:', error);
    return 0;
  }
};