import React from 'react';
import MindMapContainer from './mindmap/MindMapContainer';

/**
 * MindMap 入口组件
 * 简单包装 MindMapContainer，便于使用
 */
const MindMap = (props) => {
  return <MindMapContainer {...props} />;
};

export default MindMap;