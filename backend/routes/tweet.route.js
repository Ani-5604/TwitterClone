// routes/tweet.js
const express = require('express');
const router = express.Router();
const Tweet = require('../models/tweet.model');
const User = require('../models/user.model');

const getCurrentIST = () => {
    const utcOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    return new Date(Date.now() + utcOffset);
};

router.post('/post', async (req, res) => {
    const { userId, content } = req.body;

    // Find the user
    const user = await User.findById(userId).populate('followedUsers');
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const followedCount = user.followedUsers.length;
    const currentDate = new Date(getCurrentIST());
    const todayStart = new Date(currentDate.setHours(0, 0, 0, 0));
    const todayEnd = new Date(currentDate.setHours(23, 59, 59, 999));

    // Count the user's tweets today
    const tweetsToday = await Tweet.countDocuments({
        userId,
        createdAt: {
            $gte: todayStart,
            $lt: todayEnd,
        },
    });

    // Logic for posting tweets
    if (followedCount === 0) {
        // No followers, can post only once between 10 AM and 10:30 AM IST
        const startPostTime = new Date(currentDate.setHours(10, 0, 0, 0));
        const endPostTime = new Date(currentDate.setHours(10, 30, 0, 0));
        
        if (currentDate >= startPostTime && currentDate <= endPostTime) {
            if (tweetsToday < 1) {
                // Allow posting
                const tweet = new Tweet({ userId, content });
                await tweet.save();
                return res.status(201).json({ message: 'Tweet posted successfully!', tweet });
            } else {
                return res.status(403).json({ error: 'You can only post once between 10 AM and 10:30 AM if you follow no one.' });
            }
        } else {
            return res.status(403).json({ error: 'You can only post once between 10 AM and 10:30 AM if you follow no one.' });
        }
    } else if (followedCount <= 2) {
        // Following 2 or less people, can post up to 2 times a day
        if (tweetsToday < 2) {
            // Allow posting
            const tweet = new Tweet({ userId, content });
            await tweet.save();
            return res.status(201).json({ message: 'Tweet posted successfully!', tweet });
        } else {
            return res.status(403).json({ error: 'You can only post 2 times a day if you follow 2 people or less.' });
        }
    } else {
        // Following more than 2 people, can post multiple times
        const tweet = new Tweet({ userId, content });
        await tweet.save();
        return res.status(201).json({ message: 'Tweet posted successfully!', tweet });
    }
});

module.exports = router;
