import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const avatar = profile.photos[0]?.value ?? null;

        let user = await User.findOne({ googleId: profile.id });

        if (user) {
            // Existing Google user — sync avatar in case it changed
            user.avatar = avatar;
            user.lastActiveAt = new Date();
            await user.save();
            return done(null, user);
        }

        // Check if a local account already exists with this email
        const existingLocal = await User.findOne({ email });
        if (existingLocal) {
            // Link the Google account to the existing local account
            existingLocal.googleId = profile.id;
            existingLocal.avatar = existingLocal.avatar ?? avatar;
            existingLocal.provider = "google";
            existingLocal.isEmailVerified = true; // ✅ Google confirmed it
            await existingLocal.save();
            return done(null, existingLocal);
        }

        // Brand new user via Google
        user = await User.create({
            name: profile.displayName,
            email,
            googleId: profile.id,
            avatar,
            provider: "google",
            isEmailVerified: true,  // ✅ Google already verified it
            isOnboarded: false,
        });

        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));