import React, { createContext, useContext, useState, useEffect } from "react";
import useLocalStorage from "./useLocalStorage";
import { STORAGE_KEYS } from "../constants/config";

let didRefreshRoles = false;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [twitchUser, setTwitchUser] = useLocalStorage(
		STORAGE_KEYS.TWITCH_USER,
		null,
	);
	const [twitchToken, setTwitchToken] = useLocalStorage(
		STORAGE_KEYS.TWITCH_TOKEN,
		null,
	);
	const [isAdmin, setIsAdmin] = useState(false);
	const [isMod, setIsMod] = useState(false);
	const [authLoading, setAuthLoading] = useState(true);

	const isAuthenticated = !!twitchUser && !!twitchToken;

	useEffect(() => {
		if (!twitchUser || !twitchToken || didRefreshRoles) {
			setAuthLoading(false);
			return;
		}
		didRefreshRoles = true;

		fetch("/api/auth/verify", {
			method: "POST",
			headers: { Authorization: `Bearer ${twitchToken}` },
		})
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data) {
					setIsAdmin(data.isAdmin || false);
					setIsMod(data.isMod || false);
				}
			})
			.catch(() => {})
			.finally(() => setAuthLoading(false));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const logout = () => {
		setTwitchUser(null);
		setTwitchToken(null);
		setIsAdmin(false);
		setIsMod(false);
		didRefreshRoles = false;
	};

	const value = {
		user: twitchUser,
		token: twitchToken,
		isAuthenticated,
		isAdmin,
		isMod,
		authLoading,
		logout,
		setUser: setTwitchUser,
		setToken: setTwitchToken,
		setIsAdmin,
		setIsMod,
	};

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuth debe usarse dentro de un AuthProvider");
	}
	return ctx;
}
