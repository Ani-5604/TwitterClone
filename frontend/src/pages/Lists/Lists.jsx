import React from "react";
import "../pages.css";
import { useTranslation } from "react-i18next";  // Import the translation hook

const Lists = () => {
  const { t } = useTranslation();  // Initialize the translation hook

  return (
    <div className="page">
      <h2 className="pageTitle">{t('Welcome to Lists page')}</h2> {/* This will now be translated */}
    </div>
  );
};

export default Lists;
