import React, { useState, useEffect, useRef } from 'react';
import baseStyles from './css/BaseStyles.module.css';
import { useBackgroundContext } from '../context/BackgroundContext';
import BackgroundInfo from './BackgroundInfo';
import CurrentTranscriptBox from './speechRecognition/CurrentTranscriptBox';
import FullTranscriptBox from './speechRecognition/FullTranscriptBox';
import RecordingControls from './speechRecognition/RecordingControls';
import useSpeechRecognition from './hooks/useSpeechRecognition';
import useOptimization from './hooks/useOptimization';

function SpeechRecognition({ setOptimizedText }) {
  const { savedBackground } = useBackgroundContext();
  const savedBackgroundRef = useRef(savedBackground);
  const [wordThreshold, setWordThreshold] = useState(200);
  
  // 当savedBackground变化时，更新ref
  useEffect(() => {
    savedBackgroundRef.current = savedBackground;
    console.log('Background ref updated to:', savedBackground);
  }, [savedBackground]);
  
  // 初始化优化逻辑
  const { handleOptimization } = useOptimization(setOptimizedText, savedBackgroundRef);
  
  // 初始化语音识别逻辑 - 传入wordThreshold
  const {
    currentTranscript,
    fullTranscript,
    wordCount,
    isListening,
    transcriptKey,
    startRecognition,
    stopRecognition
  } = useSpeechRecognition(handleOptimization, wordThreshold);

  // 处理阈值变更
  const handleThresholdChange = (e) => {
    setWordThreshold(parseInt(e.target.value));
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%' // 确保组件占满父容器高度
    }}>
      <div className={baseStyles.panelHeader}>
        <h2 className={baseStyles.heading}>
          <i className="fas fa-microphone"></i> Voice Recognition
        </h2>
      </div>
      
      <BackgroundInfo />
      
      <RecordingControls 
        isListening={isListening} 
        startRecognition={startRecognition} 
        stopRecognition={stopRecognition} 
      />
      
      <CurrentTranscriptBox 
        currentTranscript={currentTranscript} 
        transcriptKey={transcriptKey} 
      />
      
      {/* 添加 style 使其填充剩余空间 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
        <FullTranscriptBox 
          fullTranscript={fullTranscript} 
          wordCount={wordCount}
          threshold={wordThreshold}
          onThresholdChange={handleThresholdChange}
          isListening={isListening}
        />
      </div>
    </div>
  );
}

export default SpeechRecognition;