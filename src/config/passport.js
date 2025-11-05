const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userService = require('../modules/user/services/userService');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/v1/user/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth profile received:', {
          id: profile.id,
          displayName: profile.displayName,
          emails: profile.emails?.map(e => e.value),
          photos: profile.photos?.map(p => p.value)
        });

        // Safely extract email and profile picture with proper null checks
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
        const profilePicture = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;
        
        if (!email) {
          console.error('Google OAuth error: No email found in profile');
          return done(new Error('No email found in Google profile'), null);
        }

        if (!profile.id) {
          console.error('Google OAuth error: No Google ID found in profile');
          return done(new Error('No Google ID found in profile'), null);
        }

        // Use the service layer to handle Google user creation/update
        const user = await userService.createOrUpdateGoogleUser({
          googleId: profile.id,
          email: email,
          name: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() || 'Google User',
          profilePicture: profilePicture
        });

        console.log('Google OAuth user processed successfully:', {
          id: user._id,
          email: user.email,
          name: user.name
        });

        return done(null, user);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

// Serialize user for the session (not used with JWT but required by passport)
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from the session (not used with JWT but required by passport)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await userService.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;