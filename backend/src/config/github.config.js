import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { findOrCreateGithubUserService } from "../services/user.service.js";

const getVerifiedEmail = async (accessToken) => {
    const res = await fetch("https://api.github.com/user/emails", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "storix-app",
        },
    });
    if (!res.ok) return null;

    const emails = await res.json();
    return (
        emails.find((e) => e.primary && e.verified) ??
        emails.find((e) => e.verified)
    )?.email;
};

passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: process.env.GITHUB_CALLBACK_URL,
            scope: ["user:email"],
        },
        async (accessToken, _refreshToken, profile, done) => {
            try {
                const email = await getVerifiedEmail(accessToken);
                if (!email) return done(null, false);

                const user = await findOrCreateGithubUserService({
                    githubId: String(profile.id),
                    email,
                    name: profile.displayName || profile.username,
                    profilePicture: profile.photos?.[0]?.value,
                });
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        },
    ),
);
