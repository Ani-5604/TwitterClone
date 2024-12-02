// routes/tweetRoutes.js
const express = require('express');
const multer = require('multer');
const verifyToken = require('../middleware/auth');
const Tweet = require('../models/Tweet');

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Create tweet
router.post('/create', verifyToken, upload.fields([{ name: 'img' }, { name: 'video' }, { name: 'audio' }]), async (req, res) => {
  try {
    const tweetData = {
      userId: req.user._id,
      content: req.body.content,
      media: {
        img: req.files['img'] ? `/uploads/${req.files['img'][0].filename}` : null,
        video: req.files['video'] ? `/uploads/${req.files['video'][0].filename}` : null,
        audio: req.files['audio'] ? `/uploads/${req.files['audio'][0].filename}` : null,
      },
    };
    const newTweet = await new Tweet(tweetData).save();
    res.status(201).json(newTweet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
