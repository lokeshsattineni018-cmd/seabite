import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import "dotenv/config";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // ✅ PRO-TIP: Using a relative path is fine if 'trust proxy' is 1 in server.js,
      // but if you get 'Redirect URI mismatch', use the full production URL here.
      callbackURL: "/api/auth/google/callback", 
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Update avatar if it changed
          user.avatar = profile.photos[0].value;
          await user.save();
          return done(null, user);
        } else {
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            avatar: profile.photos[0].value,
            role: "user",
          });
          return done(null, user);
        }
      } catch (err) {
       console.error("❌ Passport Strategy Error:", err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  // Use ._id or .id consistently
  done(null, user._id || user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (!user) return done(null, false);
    done(null, user);
  } catch (err) {
    console.error("❌ Passport Deserialize Error:", err);
    done(err, null);
  }
});

export default passport;