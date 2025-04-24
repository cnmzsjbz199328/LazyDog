import React from 'react';
import MindMapContainer from './mindmap/MindMapContainer';

/**
 * MindMap 入口组件 - 简化版
 * 不再尝试获取和传递上下文数据，而是让下游组件直接从localStorage获取
 */
const MindMap = (props) => {
  return <MindMapContainer {...props} />;
};

export default MindMap;