import React from 'react';
import { usePortalSettings } from '../../context/PortalSettingsContext';

export const TopUtilityBar: React.FC = () => {
  const { t, language, toggleLanguage, fontSize, setFontSize, highContrast, toggleHighContrast } = usePortalSettings();

  return (
    <>
      <a href="#main-content" className="skip-link">
        {t.skipToMain}
      </a>
      <div className="gov-tricolor-stripe" />
      <div className="top-utility-bar">
        <div>
          <span>{t.govIndia}</span>
          <span style={{ margin: '0 8px', opacity: 0.5 }}>|</span>
          <span>{t.aicteFull}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <a href="#screen-reader-help" onClick={(e) => { e.preventDefault(); alert("Screen Reader Accessibility: Tested with NVDA and Windows Narrator. Use Tab and Shift+Tab for logical section navigation."); }}>
            {t.screenReader}
          </a>
          <div style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '8px' }}>
            <span style={{ marginRight: '6px' }}>{t.textScale}:</span>
            <button
              onClick={() => setFontSize('sm')}
              style={{ fontWeight: fontSize === 'sm' ? 700 : 400, textDecoration: fontSize === 'sm' ? 'underline' : 'none', margin: '0 3px' }}
              aria-label="Decrease font size"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('md')}
              style={{ fontWeight: fontSize === 'md' ? 700 : 400, textDecoration: fontSize === 'md' ? 'underline' : 'none', margin: '0 3px' }}
              aria-label="Normal font size"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              style={{ fontWeight: fontSize === 'lg' ? 700 : 400, textDecoration: fontSize === 'lg' ? 'underline' : 'none', margin: '0 3px' }}
              aria-label="Increase font size"
            >
              A+
            </button>
          </div>
          <button onClick={toggleHighContrast} style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '8px' }}>
            {highContrast ? "Standard Contrast" : t.contrast}
          </button>
          <button
            onClick={toggleLanguage}
            style={{ fontWeight: 600, color: '#FF9933', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '8px' }}
          >
            {language === 'en' ? 'हिन्दी' : 'English'}
          </button>
        </div>
      </div>
    </>
  );
};
