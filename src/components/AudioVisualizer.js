import React, { useRef, useEffect, useCallback, useState } from 'react';

const AudioVisualizer = ({ audioStream, isActive }) => {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const sourceRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const initLoggedRef = useRef(false);
  const cleanupLoggedRef = useRef(false);
  
  // 降低阈值，增加灵敏度
  const detectSound = useCallback((dataArray) => {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += Math.abs(dataArray[i] - 128);
    }
    const average = sum / dataArray.length;
    return average > 0.5; // 低阈值使声波更容易被检测到
  }, []);

  // 绘制波形函数
  const drawWaveform = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!analyserRef.current) return;
      
      animationFrameRef.current = requestAnimationFrame(draw);
      
      analyserRef.current.getByteTimeDomainData(dataArray);
      
      const isSpeaking = detectSound(dataArray);
      
      // 清除画布
      canvasCtx.fillStyle = 'rgba(245, 240, 225, 0.3)';
      canvasCtx.fillRect(0, 0, width, height);
      
      canvasCtx.lineWidth = isSpeaking ? 3 : 2; // 说话时线条变粗
      canvasCtx.strokeStyle = isSpeaking 
        ? 'rgba(168, 198, 108, 0.9)' // 说话时颜色变为绿色
        : 'rgba(92, 141, 137, 0.6)'; 
      canvasCtx.beginPath();
      
      const sliceWidth = width / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * height / 2;
        
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      canvasCtx.stroke();
    };
    
    draw();
  }, [detectSound]);

  // 清理函数 - 抽出来方便复用
  const cleanupAudio = useCallback(() => {
    if (!cleanupLoggedRef.current && (animationFrameRef.current || sourceRef.current || audioContextRef.current)) {
      console.log("AudioVisualizer: 停止可视化"); // 停止日志
      cleanupLoggedRef.current = true;
      // 2秒后重置标志，允许下次输出日志
      setTimeout(() => { cleanupLoggedRef.current = false; }, 2000);
    }
    
    // 清理动画帧
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // 清理音频源
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    // 清理音频上下文
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    
    // 清理分析器
    analyserRef.current = null;
    setIsInitialized(false);
  }, []);

  // 初始化音频处理
  useEffect(() => {
    // 检查必要条件
    if (!isActive || !audioStream) {
      if (isInitialized) {
        cleanupAudio();
      }
      return;
    }
    
    // 如果已经初始化，不要重复初始化
    if (isInitialized && audioContextRef.current) {
      return;
    }
    
    // 只在组件首次初始化时输出日志
    if (!initLoggedRef.current) {
      console.log("AudioVisualizer: 开始初始化可视化"); // 启动日志
      initLoggedRef.current = true;
    }
    
    let isComponentMounted = true;
    
    const initAudio = async () => {
      try {
        // 确保清理旧实例
        cleanupAudio();
        
        // 创建音频上下文
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
        
        // 解决Chrome自动播放限制
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        
        // 创建分析器节点并设置参数
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        analyserRef.current.smoothingTimeConstant = 0.8; // 增加平滑度
        
        // 从麦克风流创建源节点
        sourceRef.current = audioContextRef.current.createMediaStreamSource(audioStream);
        sourceRef.current.connect(analyserRef.current);
        
        // 确保组件仍然挂载
        if (isComponentMounted) {
          drawWaveform();
          setIsInitialized(true);
          console.log("AudioVisualizer: 可视化初始化完成"); // 初始化完成日志
        }
      } catch (error) {
        console.error('音频初始化错误:', error);
        cleanupLoggedRef.current = false; // 发生错误时允许再次输出日志
      }
    };

    // 执行初始化
    initAudio();
    
    // 清理函数
    return () => {
      isComponentMounted = false;
      cleanupAudio();
    };
  }, [audioStream, isActive, drawWaveform, cleanupAudio, isInitialized]);

  return (
    <canvas 
      ref={canvasRef} 
      width="1200" 
      height="80" 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.7,
        zIndex: 0
      }}
    />
  );
};

export default AudioVisualizer;