import React from 'react';
import styles from '../css/RecordingControls.module.css';
import LanguageSelector from './LanguageSelector';

const RecordingControls = ({ isListening, startRecognition, stopRecognition, currentLanguage, onLanguageChange }) => {
  return (
    <>
      <div className={styles.controlsContainer}>
        <div className={styles.btnGroup}>
          <button
            onClick={startRecognition}
            disabled={isListening}
            className={`${styles.button} ${styles.startButton} ${isListening ? styles.buttonDisabled : ''}`}
          >
            <i className="fas fa-microphone"></i> Start Recording
          </button>
          <button
            onClick={stopRecognition}
            disabled={!isListening}
            className={`${styles.button} ${styles.stopButton} ${!isListening ? styles.buttonDisabled : ''}`}
          >
            <i className="fas fa-stop"></i> Stop Recording
          </button>
        </div>
        
        <LanguageSelector 
          currentLanguage={currentLanguage}
          onLanguageChange={onLanguageChange}
          disabled={isListening}
        />
      </div>
      
      {isListening && (
        <div className={styles.recordingStatus}>
          <span className={styles.pulse}></span> Recording...
        </div>
      )}
    </>
  );
};

export default RecordingControls;