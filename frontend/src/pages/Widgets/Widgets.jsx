import React from "react";
import "./widget.css";
import SearchIcon from "@mui/icons-material/Search";
import { useTranslation } from "react-i18next";
import { TwitterTimelineEmbed, TwitterTweetEmbed } from "react-twitter-embed";
const Widgets = () => {
  const { t } = useTranslation();
  return (
    <div className="widgets">
      <div className="widgets__input">
        <SearchIcon className="widget__searchIcon" />
        <input placeholder="Search Twitter" type="text" />
      </div>
      <div className="widgets__widgetContainer">
        
      <h2>{t("whatsHappening")}</h2>
        <TwitterTweetEmbed tweetId={"1816174440071241866"} />
        <TwitterTimelineEmbed
          sourceType="profile"
          screenName="Valorant"
          options={{ height: 400 }}
        />
      </div>
    </div>
  );
};

export default Widgets;