export const STORAGE_CONFIG = {
  // 存储键名
  KEYS: {
    BACKGROUND: 'lastSavedBackground',
    HISTORY: 'apiResponse',
    MIND_MAP: 'mindmap_data',
    MIND_MAP_CACHE_PREFIX: 'mindmap_cache_',
    NODE_EXPANSION_PREFIX: 'node_expansion_'
  },
  
  // 缓存设置
  CACHE: {
    EXPIRY_HOURS: 24,
    ENABLED: true
  },
  
  // 事件设置
  EVENTS: {
    UPDATE_EVENT_NAME: 'localStorageUpdated',
    DISPATCH_EVENTS: true
  },
  
  // 数据验证设置
  VALIDATION: {
    INVALID_MAIN_POINTS: ['Mind Map', 'No main point'],
    INVALID_CONTENTS: ['No Content']
  }
};