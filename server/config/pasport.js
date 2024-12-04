import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import User from '../models/user.model.js'; // Adjust the path based on your project structure

dotenv.config();

// Google OAuth Strategy configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/google/callback`, // Google callback route
    },
    async (accessToken, refreshToken, profile, done) => {
      const { id, displayName, emails, photos } = profile;
      const email = emails[0]?.value;
      const avatar = photos[0]?.value;

      try {
        // Check if user exists in the database
        let user = await User.findOne({ googleId: id });

        if (!user) {
          // If not, create a new user
          user = await User.create({
            googleId: id,
            email,
            name: displayName,
            avatar,
          });
        }

        done(null, user); // Pass user to the next middleware
      } catch (error) {
        done(error, null); // Handle errors gracefully
      }
    }
  )
);

// Serialize user into session
passport.serializeUser((user, done) => done(null, user.id));

// Deserialize user from session
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => done(err, user));
});

export default passport;
