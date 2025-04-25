import { storageService } from '../services/storageService';

/**
 * 保存内容到 localStorage (通过 storageService)
 * @param {object} data - 包含 content 和 mainPoint 的对象
 * @returns {boolean} - 是否成功保存
 */
export const saveContentToLocalStorage = (data) => {
  return storageService.saveHistoryRecord(data);
};

/**
 * 清理存储内容 (通过 storageService)
 * @returns {number} - 移除的记录数量
 */
export const cleanStorageContent = () => {
  return storageService.cleanInvalidRecords();
};

/**
 * 保存思维导图数据到 localStorage (通过 storageService)
 * @param {object} data - 思维导图数据对象
 * @returns {boolean} - 是否成功保存
 */
export const saveMindMapDataToLocalStorage = (data) => {
  return storageService.saveMindMapData(data);
};