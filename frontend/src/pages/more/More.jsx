import React from 'react'
import '../pages.css'
import { useTranslation } from 'react-i18next'
const More = () => {
  const {t} =useTranslation();
  return (
    <div className="page">
      <h2 className="pageTitle">{t("Welcome to More Page")}</h2>
    </div>
  )
}

export default More