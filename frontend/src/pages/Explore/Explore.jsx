import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './Explore.css'; // Importing a separate CSS file for styling

const Explore = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [exploreContent, setExploreContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // To manage loading state
  const [noResults, setNoResults] = useState(false); // For handling no content found

  // Simulating fetching explore content from an API
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setNoResults(false);
  };

  // Filter content based on search query
  const filteredContent = exploreContent.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (filteredContent.length === 0 && searchQuery) {
      setNoResults(true);
    } else {
      setNoResults(false);
    }
  }, [searchQuery, filteredContent]);

  return (
    <div className="explore-page">
      <h2 className="explore-title">{t("Welcome to Explore Page")}</h2>

      {/* Search bar */}
      <div className="search-box">
        <input
          type="text"
          placeholder={t('searchContent')}
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>

      {/* Display loading state */}
      {isLoading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('loadingContent')}</p>
        </div>
      ) : (
        <div className="explore-content">
          {noResults ? (
            <p className="no-results">{t('noContentFound')} "{searchQuery}"</p>
          ) : (
            filteredContent.map((item) => (
              <div key={item.id} className="explore-item">
                <h3 className="item-title">{item.title}</h3>
                <p className="item-description">{item.description}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Explore;
