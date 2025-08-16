import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

function LanguageToggle() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'sw', name: 'Kiswahili', native: 'Kiswahili' },
    { code: 'am', name: 'Amharic', native: 'አማርኛ' },
    { code: 'om', name: 'Afan Oromo', native: 'Afaan Oromoo' },
    { code: 'ti', name: 'Tigrigna', native: 'ትግርኛ' },
    { code: 'fr', name: 'French', native: 'Français' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-transparent border border-gray-600 rounded-md text-white hover:text-accent hover:bg-gray-800 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-300"
      >
        <span className="font-light">{currentLanguage.native}</span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-charcoal-800 border border-gray-700 rounded-md shadow-lg z-50 backdrop-blur-sm">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 first:rounded-t-md last:rounded-b-md transition-colors duration-200 ${
                i18n.language === language.code 
                  ? 'bg-accent text-black font-medium' 
                  : 'text-white hover:text-accent'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-light">{language.native}</span>
                <span className="text-xs text-gray-400">{language.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default LanguageToggle;