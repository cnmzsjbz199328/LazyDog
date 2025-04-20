import React from 'react';
import styles from '../css/RecordingControls.module.css';

const languages = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'zh-CN', name: '中文 (简体)' },
  { code: 'zh-TW', name: '中文 (繁體)' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'ko-KR', name: '한국어' },
  { code: 'fr-FR', name: 'Français' },
  { code: 'de-DE', name: 'Deutsch' },
  { code: 'es-ES', name: 'Español' },
  { code: 'it-IT', name: 'Italiano' },
  { code: 'ru-RU', name: 'Русский' },
  { code: 'pt-BR', name: 'Português' }
];

const LanguageSelector = ({ currentLanguage, onLanguageChange, disabled }) => {
  return (
    <select
      className={styles.languageSelector}
      value={currentLanguage}
      onChange={(e) => onLanguageChange(e.target.value)}
      disabled={disabled}
      title="Select recognition language"
    >
      {languages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
};

export default LanguageSelector;