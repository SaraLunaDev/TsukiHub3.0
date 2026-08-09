export const API_URLS = {
	TWITCH_AUTH: "https://id.twitch.tv/oauth2/authorize",
	TWITCH_TOKEN: "https://id.twitch.tv/oauth2/token",
	TWITCH_VALIDATE: "https://id.twitch.tv/oauth2/validate",
	TWITCH_USERS: "https://api.twitch.tv/helix/users",
};

export const TWITCH_CONFIG = {
	CLIENT_ID: "***REMOVED***",
	REDIRECT_URI: window.location.origin,
	SCOPES: ["user:read:email"],
};

export const STORAGE_KEYS = {
	TWITCH_USER: "twitchUser",
	TWITCH_TOKEN: "twitchToken",
	DARK_MODE: "darkMode",
	IS_ADMIN: "isAdmin",
	IS_MOD: "isMod",
};
