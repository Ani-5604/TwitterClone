import React, { useEffect, useState } from "react";
import "./Feed.css";
import Posts from "./Posts/Posts";
import Tweetbox from "./Tweetbox/Tweetbox";
import { useTranslation } from "react-i18next";
const Feed = () => {
  const [post, setpost] = useState([]);
  const { t } = useTranslation();  // Initialize the translation hook
  useEffect(() => {
    fetch("https://twitter-twilller-1.onrender.com/post")
      .then((res) => res.json())
      .then((data) => {
        setpost(data);
      })
      
  },[post]);
  
  return (
    <div className="feed">
      <div className="feed__header">
        <h2>{t('Home')}</h2>
      </div>
      <Tweetbox />
      {post.map((p) => (
        <Posts key={p._id} p={p} />
      ))}
    </div>
  );
};

export default Feed;