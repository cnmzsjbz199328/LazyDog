import { useCallback } from 'react';
import { optimizeText } from '../../utils/utils';

const useOptimization = (setOptimizedText, savedBackgroundRef) => {
  // 优化逻辑包装为useCallback
  const handleOptimization = useCallback((text, optimizationInProgressRef) => {
    try {
      optimizationInProgressRef.current = true;
      
      // 直接从ref读取最新的背景信息
      const currentBackground = savedBackgroundRef.current;
      
      // 增加显式日志
      console.log('OPTIMIZATION REQUEST WITH BACKGROUND:', currentBackground);
      
      return optimizeText(text, setOptimizedText, 'mistral_pixtral', currentBackground)
        .then(result => {
          console.log('Optimization successful:', result);
          console.log('Background info used:', currentBackground ? 'Yes' : 'No');
          return result;
        })
        .catch(error => {
          console.error('Optimization error:', error);
          // 即使出错，也不影响继续转录
        })
        .finally(() => {
          setTimeout(() => {
            optimizationInProgressRef.current = false;
            console.log('Optimization flag reset, ready for next batch');
          }, 1000);
        });
    } catch (e) {
      console.error('Fatal error in handleOptimization:', e);
      optimizationInProgressRef.current = false;
      return Promise.resolve();
    }
  }, [setOptimizedText, savedBackgroundRef]);

  return { handleOptimization };
};

export default useOptimization;