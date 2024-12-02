import React from "react";
import { useTranslation } from "react-i18next";
import '../pages.css';
const Message = () => {
  const { t } = useTranslation();  // Initialize the translation hook
  return (
    <div className="page">
      <h2 className="pageTitle">{t("Welcome to Message page")}</h2>
    </div>
  );
};

export default Message;