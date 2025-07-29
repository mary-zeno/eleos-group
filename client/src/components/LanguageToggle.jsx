import React from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from "@/components/ui/switch";

function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'am' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm ${i18n.language === "en" ? "font-bold" : "text-gray-400"}`}>EN</span>
      <Switch
        checked={i18n.language === "am"}
        onCheckedChange={toggleLanguage}
        className="bg-gray-300 data-[state=checked]:bg-charcoal"
      />
      <span className={`text-sm ${i18n.language === "am" ? "font-bold" : "text-gray-400"}`}>አማ</span>
    </div>
  );
}

export default LanguageToggle;
