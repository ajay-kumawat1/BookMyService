import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../Models/UserModel.js';
import { hashPassword, signToken } from '../Common/common.js';
import dotenv from 'dotenv';

dotenv.config();

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'https://bookmyservice.onrender.com/api/auth/google/callback',
      scope: ['profile', 'email'],
      // Add these options to help with debugging
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Check if user exists with the same email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Update existing user with Google ID
          user.googleId = profile.id;
          user.authProvider = 'google';
          if (!user.isVerified) {
            user.isVerified = true;
          }
          await user.save();
          return done(null, user);
        }

        // Create new user
        const newUser = await User.create({
          googleId: profile.id,
          firstName: profile.name.givenName || profile.displayName.split(' ')[0],
          lastName: profile.name.familyName || profile.displayName.split(' ').slice(1).join(' '),
          email: profile.emails[0].value,
          avatar: profile.photos[0].value,
          isVerified: true,
          authProvider: 'google',
        });

        return done(null, newUser);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Facebook Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: 'https://bookmyservice.onrender.com/api/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'photos', 'email', 'name'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ facebookId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Check if user exists with the same email
        if (profile.emails && profile.emails.length > 0) {
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Update existing user with Facebook ID
            user.facebookId = profile.id;
            user.authProvider = 'facebook';
            if (!user.isVerified) {
              user.isVerified = true;
            }
            await user.save();
            return done(null, user);
          }
        }

        // Create new user
        const newUser = await User.create({
          facebookId: profile.id,
          firstName: profile.name.givenName || profile.displayName.split(' ')[0],
          lastName: profile.name.familyName || profile.displayName.split(' ').slice(1).join(' '),
          email: profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`,
          avatar: profile.photos ? profile.photos[0].value : null,
          isVerified: true,
          authProvider: 'facebook',
        });

        return done(null, newUser);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;
