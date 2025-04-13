import { useEffect, useState } from 'react';

/**
 * 用于加载和初始化 Mermaid 库的 React Hook
 * @returns {Object} - Mermaid 加载状态
 */
const useMermaid = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 检查 mermaid 是否已全局可用
    if (!window.mermaid) {
      // 如果没有，添加脚本标签来加载它
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js';
      script.async = true;
      
      script.onload = () => {
        if (window.mermaid) {
          console.log("Mermaid library loaded successfully");
          initializeMermaid();
          setIsLoaded(true);
        }
      };
      
      document.body.appendChild(script);
      
      return () => {
        // 清理函数
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    } else {
      // 如果已存在，只初始化
      initializeMermaid();
      setIsLoaded(true);
    }
  }, []);

  // 初始化 Mermaid 配置
  const initializeMermaid = () => {
    window.mermaid.initialize({
      startOnLoad: false, // 我们将手动处理渲染
      theme: 'default',
      flowchart: {
        curve: 'basis',
        nodeSpacing: 50,
        rankSpacing: 70,
        useMaxWidth: true,
        htmlLabels: true
      },
      securityLevel: 'loose'
    });
  };

  return { isLoaded };
};

export default useMermaid;