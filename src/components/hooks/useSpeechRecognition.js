import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 自定义 Hook 处理语音识别的核心逻辑
 * @param {function} handleOptimization - 优化处理函数
 * @param {number} wordThreshold - 触发优化的字数阈值
 */
const useSpeechRecognition = (handleOptimization, wordThreshold = 200) => {
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [fullTranscript, setFullTranscript] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcriptKey, setTranscriptKey] = useState(0);
  
  const recognitionRef = useRef(null);
  const optimizationInProgressRef = useRef(false);
  const accumulatedTranscriptRef = useRef('');
  const isListeningRef = useRef(false);
  
  // 使用ref来存储阈值，这样不需要重新创建事件处理函数
  const wordThresholdRef = useRef(wordThreshold);

  // 当阈值变化时更新ref
  useEffect(() => {
    wordThresholdRef.current = wordThreshold;
    console.log('Word threshold updated:', wordThreshold);
  }, [wordThreshold]);

  // 当isListening状态变化时，同步更新ref值
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // 处理 aborted 错误
  const handleAbortedError = useCallback(() => {
    console.log('Recognition was aborted, attempting to recover...');
    
    // 避免立即重启，给一点延迟
    setTimeout(() => {
      if (isListeningRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            if (isListeningRef.current) {
              recognitionRef.current.start();
              console.log('Successfully restarted after abort');
            }
          }, 500);
        } catch (e) {
          console.error('Failed to restart after abort:', e);
          setIsListening(false);
        }
      }
    }, 1000);
  }, []);

  // 初始化和处理语音识别逻辑
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Your browser does not support Web Speech API.');
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.lang = 'en-US';
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;

    recognitionInstance.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      // 累加本次事件的所有最终结果
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          let text = result[0].transcript.trim();
          if (!/[.!?]$/.test(text)) {
            text += '.';
          }
          finalTranscript += (finalTranscript ? ' ' : '') + text;
        } else {
          interimTranscript = result[0].transcript;
        }
      }

      // 更新当前转录（显示最新结果）
      setCurrentTranscript(finalTranscript || interimTranscript);
      setTranscriptKey(prev => prev + 1); // 重置动画

      // 只有在没有正在进行优化时才累积结果
      if (finalTranscript && !optimizationInProgressRef.current) {
        accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? ' ' : '') + finalTranscript;
        setFullTranscript(accumulatedTranscriptRef.current);

        const words = accumulatedTranscriptRef.current.split(/\s+/).filter((word) => word.length > 0);
        setWordCount(words.length);

        console.log('Full Transcript:', accumulatedTranscriptRef.current);
        
        // 使用ref中的阈值进行检查
        if (!optimizationInProgressRef.current && 
            words.length >= wordThresholdRef.current && 
            accumulatedTranscriptRef.current.includes('.')) {
          
          // 达到优化标准时处理当前文本
          const textToOptimize = accumulatedTranscriptRef.current;
          
          // 重置累积的转录和显示的全文
          accumulatedTranscriptRef.current = '';
          setFullTranscript('');
          setWordCount(0);
          
          // 标记优化过程开始，防止重复触发
          optimizationInProgressRef.current = true;
          
          handleOptimization(textToOptimize, optimizationInProgressRef);
        }
      }
    };

    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // 特殊处理aborted错误
      if (event.error === 'aborted') {
        handleAbortedError();
        return;
      }
      
      // 只在非暂时性错误时停止
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognitionInstance.onend = () => {
      console.log('Recognition ended, isListening:', isListeningRef.current);
      
      // 使用ref检查当前状态，避免闭包问题
      if (isListeningRef.current) {
        // 给一个短暂延迟再重启，避免连续快速重启
        setTimeout(() => {
          try {
            recognitionInstance.start();
            console.log('Recognition restarted');
          } catch (e) {
            console.error('Failed to restart recognition:', e);
            setIsListening(false);
          }
        }, 300);
      } else {
        // 手动停止时处理最终结果
        if (accumulatedTranscriptRef.current && !optimizationInProgressRef.current) {
          handleOptimization(accumulatedTranscriptRef.current, optimizationInProgressRef);
        }
      }
    };

    recognitionRef.current = recognitionInstance;

    // 组件卸载时清理
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error('Error stopping recognition on cleanup:', err);
        }
      }
    };
  }, [handleAbortedError, handleOptimization]);

  // 监听isListening状态变化，控制录音
  useEffect(() => {
    if (!recognitionRef.current) return; // 确保实例已初始化
    
    if (isListening) {
      // 尝试启动录音
      try {
        recognitionRef.current.start();
        console.log('Started recognition');
      } catch (err) {
        console.error('Failed to start recognition:', err);
        // 如果是"already started"错误，不需要重置状态
        if (err.message !== 'Failed to execute \'start\' on \'SpeechRecognition\': recognition has already started.') {
          setIsListening(false);
        }
      }
    } else {
      // 尝试停止录音
      try {
        recognitionRef.current.stop();
        console.log('Stopped recognition');
      } catch (err) {
        console.error('Failed to stop recognition:', err);
      }
    }
  }, [isListening]);

  const startRecognition = useCallback(() => {
    if (!isListening) {
      console.log('Requesting to start recognition');
      setFullTranscript(''); // 重置显示的转录
      accumulatedTranscriptRef.current = ''; // 重置累积的转录
      setWordCount(0);
      optimizationInProgressRef.current = false; // 重置优化标志
      setIsListening(true); // 这会触发上面的useEffect来实际启动录音
    }
  }, [isListening]);

  const stopRecognition = useCallback(() => {
    if (isListening) {
      console.log('Requesting to stop recognition');
      setIsListening(false); // 这会触发上面的useEffect来实际停止录音
    }
  }, [isListening]);

  return {
    currentTranscript,
    fullTranscript,
    wordCount,
    isListening,
    transcriptKey,
    startRecognition,
    stopRecognition
  };
};

export default useSpeechRecognition;