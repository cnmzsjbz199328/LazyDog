import React, { useState, useEffect, useRef } from 'react';
import AudioVisualizer from './AudioVisualizer';

// 修改组件以接收 isRecording 属性
const Header = ({ isRecording = false }) => {
  const [audioStream, setAudioStream] = useState(null);
  const streamRef = useRef(null); // 使用 ref 存储流，以便在清理函数中访问

  // 组件挂载时请求麦克风权限
  useEffect(() => {
    console.log("Header: 初始化麦克风"); // 启动日志
    
    const initializeAudio = async () => {
      try {
        // 请求获取麦克风流
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        setAudioStream(stream);
        streamRef.current = stream; // 存储到 ref 中
        console.log("Header: 麦克风初始化成功"); // 成功日志
      } catch (err) {
        console.error('获取麦克风权限失败:', err);
        // 即使失败也继续显示标题
      }
    };

    initializeAudio();

    // 组件卸载时清理音频流
    return () => {
      console.log("Header: 清理麦克风流"); // 停止日志
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []); // 空依赖数组，只在组件挂载和卸载时执行

  return (
    <div className="header">
      {/* 声波背景 - 只在录音时显示 */}
      <div className="header-background">
        {audioStream && isRecording && (
          <AudioVisualizer 
            audioStream={audioStream} 
            isActive={isRecording} // 直接使用 isRecording 作为控制标志
          />
        )}
      </div>
      
      {/* 标题内容 */}
      <div className="header-content">
        <h1>LazyDog</h1>
      </div>
    </div>
  );
};

export default Header;
