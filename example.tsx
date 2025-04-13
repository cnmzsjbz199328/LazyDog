import React, { useState, useEffect } from 'react';
import mermaid from 'mermaid';

const MindMapComponent = () => {
  // 初始思维导图数据
  const [mindMapData, setMindMapData] = useState(`mindmap
  root((思维导图))
    基本功能
      节点创建
      节点编辑
      节点连接
    布局选项
      水平布局
      垂直布局
      径向布局
    UI控制
      缩放控制
      拖拽功能
      全屏展示
    数据管理
      导入功能
      导出功能
      自动保存`);
  
  const [layout, setLayout] = useState('vertical');
  const [fontSize, setFontSize] = useState(14);
  const [lineColor, setLineColor] = useState('#333333');
  const [nodeColor, setNodeColor] = useState('#1f77b4');
  const [theme, setTheme] = useState('default');
  
  // 初始化并更新Mermaid图表
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: theme,
      mindmap: {
        padding: 16,
        useMaxWidth: true
      }
    });
    
    updateDiagram();
  }, [mindMapData, layout, fontSize, lineColor, nodeColor, theme]);
  
  // 更新图表函数
  const updateDiagram = () => {
    try {
      document.getElementById('mindmap-container').innerHTML = '';
      mermaid.render('mindmap', mindMapData, (svgCode) => {
        document.getElementById('mindmap-container').innerHTML = svgCode;
        
        // 应用样式
        const svg = document.querySelector('#mindmap-container svg');
        if (svg) {
          svg.style.width = '100%';
          svg.style.maxHeight = '500px';
          
          // 应用字体大小
          const textElements = svg.querySelectorAll('text');
          textElements.forEach(text => {
            text.style.fontSize = `${fontSize}px`;
          });
          
          // 应用线条颜色
          const edges = svg.querySelectorAll('.edge');
          edges.forEach(edge => {
            const paths = edge.querySelectorAll('path');
            paths.forEach(path => {
              path.style.stroke = lineColor;
            });
          });
          
          // 应用节点颜色
          const nodes = svg.querySelectorAll('.node');
          nodes.forEach(node => {
            const circles = node.querySelectorAll('circle');
            circles.forEach(circle => {
              circle.style.fill = nodeColor;
            });
          });
        }
      });
    } catch (error) {
      console.error('Mermaid 渲染错误:', error);
    }
  };
  
  // 处理思维导图内容变化
  const handleMindMapChange = (e) => {
    setMindMapData(e.target.value);
  };
  
  // 更新布局
  const updateLayout = (newLayout) => {
    let updatedData = mindMapData;
    if (newLayout === 'horizontal') {
      updatedData = updatedData.replace('mindmap', 'mindmap\n  direction LR');
    } else if (newLayout === 'vertical') {
      updatedData = updatedData.replace(/mindmap\s+direction LR/g, 'mindmap');
    }
    setMindMapData(updatedData);
    setLayout(newLayout);
  };
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">交互式思维导图</h2>
      
      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">布局:</label>
          <select 
            className="border rounded p-1"
            value={layout}
            onChange={(e) => updateLayout(e.target.value)}
          >
            <option value="vertical">垂直布局</option>
            <option value="horizontal">水平布局</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">字体大小:</label>
          <input 
            type="number" 
            className="border rounded p-1 w-16"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            min="8"
            max="24"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">线条颜色:</label>
          <input 
            type="color" 
            className="border rounded p-1 h-8"
            value={lineColor}
            onChange={(e) => setLineColor(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">节点颜色:</label>
          <input 
            type="color" 
            className="border rounded p-1 h-8"
            value={nodeColor}
            onChange={(e) => setNodeColor(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">主题:</label>
          <select 
            className="border rounded p-1"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="default">默认</option>
            <option value="forest">森林</option>
            <option value="dark">暗黑</option>
            <option value="neutral">中性</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">思维导图代码:</label>
          <textarea 
            className="w-full h-64 border rounded p-2 font-mono text-sm"
            value={mindMapData}
            onChange={handleMindMapChange}
          />
          <div className="text-sm text-gray-500 mt-1">
            使用Mermaid语法编辑思维导图内容
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">预览:</label>
          <div 
            id="mindmap-container" 
            className="border bg-white rounded p-2 h-64 overflow-auto"
          ></div>
        </div>
      </div>
      
      <div className="mt-4 text-sm">
        <h3 className="font-medium">使用提示:</h3>
        <ul className="list-disc pl-5 mt-1">
          <li>节点使用缩进表示层级关系</li>
          <li>使用((文本))创建圆形节点</li>
          <li>使用[文本]创建矩形节点</li>
          <li>可以随时调整布局和样式参数</li>
        </ul>
      </div>
    </div>
  );
};

export default MindMapComponent;

获取 Outlook for iOS