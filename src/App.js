import React, { useState, useEffect } from 'react';
import SpeechRecognition from './components/SpeechRecognition';
import OptimizedText from './components/OptimizedText';
import ContentDisplay from './components/ContentDisplay';
import MindMap from './components/MindMap';
import Header from './components/Header';
import { ApiProvider } from './context/ApiContext';
import { BackgroundProvider } from './context/BackgroundContext';
import './App.css';

function App() {
  const [optimizedText, setOptimizedText] = useState(null);
  const [isRecording, setIsRecording] = useState(false); // 添加录音状态
  const [parsedContent, setParsedContent] = useState({
    content: "",
    mainPoint: ""
  });

  // Parse content when optimized text is updated
  useEffect(() => {
    if (optimizedText) {
      try {
        const parsed = JSON.parse(optimizedText);
        setParsedContent(parsed);
      } catch (e) {
        console.error('Error parsing optimized text:', e);
      }
    }
  }, [optimizedText]);

  return (
    <ApiProvider>
      <BackgroundProvider>
        <div className="App">
          <Header isRecording={isRecording} />

          <div className="container">
            <div className="speechPanel">
              <SpeechRecognition 
                setOptimizedText={setOptimizedText} 
                setIsRecording={setIsRecording} // 传递录音状态设置函数
              />
            </div>
            
            <div className="centerPanel">
              <ContentDisplay />
            </div>
            
            <div className="rightPanel">
              <OptimizedText optimizedText={optimizedText} />
              
              <MindMap 
                content={parsedContent.content} 
                mainPoint={parsedContent.mainPoint}
              />
            </div>
          </div>
        </div>
      </BackgroundProvider>
    </ApiProvider>
  );
}

export default App;