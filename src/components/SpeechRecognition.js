import React, { useState, useEffect, useRef } from 'react';
import baseStyles from './css/BaseStyles.module.css';
import styles from './css/TranscriptDisplay.module.css'; // 导入样式
import { useBackgroundContext } from '../context/BackgroundContext';
import BackgroundInfo from './BackgroundInfo';
import CurrentTranscriptBox from './speechRecognition/CurrentTranscriptBox';
import FullTranscriptBox from './speechRecognition/FullTranscriptBox';
import RecordingControls from './speechRecognition/RecordingControls';
import useSpeechRecognition from './hooks/useSpeechRecognition';
import useOptimization from './hooks/useOptimization';

const SpeechRecognition = ({ setOptimizedText, setIsRecording }) => {
  const { savedBackground } = useBackgroundContext();
  const savedBackgroundRef = useRef(savedBackground);
  const [wordThreshold, setWordThreshold] = useState(200);
  const [language, setLanguage] = useState('en-US');
  
  // 当savedBackground变化时，更新ref
  useEffect(() => {
    savedBackgroundRef.current = savedBackground;
    console.log('Background ref updated to:', savedBackground);
  }, [savedBackground]);
  
  // 初始化优化逻辑
  const { handleOptimization } = useOptimization(setOptimizedText, savedBackgroundRef);
  
  // 初始化语音识别逻辑 - 传入wordThreshold和language
  const {
    currentTranscript,
    fullTranscript,
    wordCount,
    isListening,
    transcriptKey,
    currentLanguage,
    setCurrentLanguage,
    startRecognition,
    stopRecognition
  } = useSpeechRecognition(handleOptimization, wordThreshold, language);

  // 开始录音
  const startRecording = () => {
    startRecognition();
    setIsRecording(true); // 添加这行，设置正在录音状态
  };

  // 停止录音
  const stopRecording = () => {
    stopRecognition();
    setIsRecording(false); // 添加这行，设置录音已停止
  };

  // 处理阈值变更
  const handleThresholdChange = (e) => {
    setWordThreshold(parseInt(e.target.value));
  };
  
  // 处理语言变更
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setCurrentLanguage(newLanguage);
  };

  return (
    <div className={styles.speechRecognitionContainer}>
      <div className={baseStyles.panelHeader}>
        <h2 className={baseStyles.heading}>
          <i className="fas fa-microphone"></i> Voice Recognition
        </h2>
      </div>
      
      <BackgroundInfo />
      
      <RecordingControls 
        isListening={isListening} 
        startRecognition={startRecording} 
        stopRecognition={stopRecording}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
      />
      
      <CurrentTranscriptBox 
        currentTranscript={currentTranscript} 
        transcriptKey={transcriptKey} 
      />
      
      <div className={styles.fullTranscriptWrapper}>
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