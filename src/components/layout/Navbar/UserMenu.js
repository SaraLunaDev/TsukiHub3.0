import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../../../hooks/useLocalStorage";
import { useAuth } from "../../../hooks/useAuth";
import {
	TWITCH_CONFIG,
	API_URLS,
	STORAGE_KEYS,
} from "../../../constants/config";
import "./UserMenu.css";

import { MaterialSymbolsAccountCircleFull } from "../../icons/MaterialSymbolsAccountCircleFull";
import { MaterialSymbolsAddCircleOutlineRounded } from "../../icons/MaterialSymbolsAddCircleOutlineRounded";
import { MaterialSymbolsWbSunnyOutlineRounded } from "../../icons/MaterialSymbolsWbSunnyOutlineRounded";
import { MaterialSymbolsDarkModeOutlineRounded } from "../../icons/MaterialSymbolsDarkModeOutlineRounded";
import { MdiTwitch } from "../../icons/MdiTwitch";
import { MingcuteExitLine } from "../../icons/MingcuteExitLine";
import { MaterialSymbolsListsRounded } from "../../icons/MaterialSymbolsListsRounded";
import { MingcuteSwordFill } from "../../icons/MingcuteSwordFill";
import { MaterialSymbolsSettingsRounded } from "../../icons/MaterialSymbolsSettingsRounded";

const PAGE_ACTIONS = {
	"/juegos": {
		recomend: "/juegos/recomendar",
		addItem: { label: "Añadir Juego", path: "/juegos/anadir" },
	},
	"/pelis": {
		recomend: "/pelis/recomendar",
		addItem: { label: "Añadir Pelicula/Serie", path: "/pelis/anadir" },
	},
};

function UserMenu() {
	const auth = useAuth();
	const [darkMode, setDarkMode] = useLocalStorage(
		STORAGE_KEYS.DARK_MODE,
		true,
	);
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const menuRef = useRef(null);
	const navigate = useNavigate();
	const pathname = window.location.pathname;
	const isMobile = window.innerWidth < 769;
	const isJuegosPelis = pathname === "/juegos" || pathname === "/pelis";
	const pageConfig = PAGE_ACTIONS[pathname];

	useEffect(() => {
		document.body.classList.toggle("dark-mode", darkMode);
	}, [darkMode]);

	useEffect(() => {
		if (!isOpen) return;
		const handler = (e) => {
			if (menuRef.current && !menuRef.current.contains(e.target))
				setIsOpen(false);
		};
		document.addEventListener("mousedown", handler);
		document.addEventListener("touchstart", handler);
		return () => {
			document.removeEventListener("mousedown", handler);
			document.removeEventListener("touchstart", handler);
		};
	}, [isOpen]);

	const authProcessedRef = useRef(false);

	useEffect(() => {
		const handleAuthCallback = async () => {
			const hash = window.location.hash;
			if (!hash || !hash.includes("access_token")) return;

			if (authProcessedRef.current) return;
			authProcessedRef.current = true;

			window.history.replaceState(
				null,
				"",
				window.location.pathname + window.location.search,
			);

			setLoading(true);
			const params = new URLSearchParams(hash.substring(1));
			const accessToken = params.get("access_token");
			if (!accessToken) {
				setLoading(false);
				return;
			}

			try {
				const response = await fetch("/api/auth/verify", {
					method: "POST",
					headers: { Authorization: `Bearer ${accessToken}` },
				});

				if (response.ok) {
					const data = await response.json();
					if (data.user) {
						auth.setUser(data.user);
						auth.setIsAdmin(data.isAdmin || false);
						auth.setIsMod(data.isMod || false);
						auth.setToken(accessToken);
					}
				}
			} catch {
			} finally {
				setLoading(false);
			}
		};

		handleAuthCallback();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleLogin = () => {
		const authUrl =
			`${API_URLS.TWITCH_AUTH}?` +
			new URLSearchParams({
				client_id: TWITCH_CONFIG.CLIENT_ID,
				redirect_uri: TWITCH_CONFIG.REDIRECT_URI,
				response_type: "token",
				scope: TWITCH_CONFIG.SCOPES.join(" "),
			}).toString();
		window.location.href = authUrl;
	};

	const handleLogout = () => {
		auth.logout();
		setIsOpen(false);
		navigate("/");
	};

	const goToProfile = () => {
		if (auth.user) {
			navigate(`/user/${auth.user.login}`);
			setIsOpen(false);
		}
	};

	if (loading) {
		return (
			<div className="user-menu-button">
				<span className="user-menu-loading">...</span>
			</div>
		);
	}

	return (
		<div className="user-menu" ref={menuRef}>
			<button
				className="user-menu-button"
				onClick={() => setIsOpen(!isOpen)}
				title={
					auth.user
						? `${auth.user.displayName}${auth.isAdmin ? " · Admin" : auth.isMod ? " · Mod" : ""}`
						: "Menu de usuario"
				}
			>
				{auth.user ? (
					<span className="user-menu-avatar-wrapper">
						<img
							src={auth.user.profileImage}
							alt={auth.user.displayName}
							className="user-menu-avatar"
						/>
						{auth.isAdmin && (
							<MaterialSymbolsSettingsRounded className="user-menu-role-badge user-menu-role-badge--admin" />
						)}
						{auth.isMod && !auth.isAdmin && (
							<MingcuteSwordFill className="user-menu-role-badge user-menu-role-badge--mod" />
						)}
					</span>
				) : (
					<MaterialSymbolsAccountCircleFull className="user-menu-icon" />
				)}
			</button>

			{isOpen && (
				<div className="user-menu-dropdown">
					<div className="user-menu-options">
						{auth.user && (
							<button
								className="user-menu-profile-button"
								onClick={goToProfile}
							>
								<span className="user-menu-profile-avatar-wrapper">
									<img
										src={auth.user.profileImage}
										alt={auth.user.displayName}
										className="user-menu-profile-avatar"
									/>
									{auth.isAdmin && (
										<MaterialSymbolsSettingsRounded className="user-menu-role-badge user-menu-role-badge--admin" />
									)}
									{auth.isMod && !auth.isAdmin && (
										<MingcuteSwordFill className="user-menu-role-badge user-menu-role-badge--mod" />
									)}
								</span>
								<div className="user-menu-profile-info">
									<span className="user-menu-profile-name">
										{auth.user.displayName}
									</span>
									<span className="user-menu-profile-link">
										Mostrar Perfil
									</span>
								</div>
							</button>
						)}

						{isJuegosPelis && (
							<>
								{isMobile && (
									<MenuOption
										icon={
											<MaterialSymbolsListsRounded className="user-menu-option-icon" />
										}
										label="Recomendaciones"
										primary
										divider={!auth.user}
										onClick={() => {
											window.location.href =
												pageConfig.recomend;
											setIsOpen(false);
										}}
									/>
								)}
								{auth.isAdmin && (
									<MenuOption
										icon={
											<MaterialSymbolsAddCircleOutlineRounded className="user-menu-option-icon" />
										}
										label={pageConfig.addItem.label}
										primary
										divider
										onClick={() => {
											navigate(pageConfig.addItem.path);
											setIsOpen(false);
										}}
									/>
								)}
							</>
						)}

						<MenuFooter
							isMobile={isMobile}
							isLoggedIn={!!auth.user}
							darkMode={darkMode}
							isJuegosPelis={isJuegosPelis}
							onToggleTheme={() => {
								setDarkMode(!darkMode);
								setIsOpen(false);
							}}
							onLogin={handleLogin}
							onLogout={handleLogout}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
function MenuOption({ icon, label, primary, danger, theme, divider, onClick }) {
	const cls = [
		"user-menu-option",
		primary && "user-menu-option-primary",
		danger && "user-menu-option-danger",
		theme && "user-menu-option-theme",
		divider && "user-menu-option-divider",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<button className={cls} onClick={onClick}>
			{icon}
			<span className="user-menu-option-text">{label}</span>
		</button>
	);
}

function MenuFooter({
	isMobile,
	isLoggedIn,
	darkMode,
	isJuegosPelis,
	onToggleTheme,
	onLogin,
	onLogout,
}) {
	if (isMobile && !isLoggedIn) {
		return (
			<>
				<MenuOption
					icon={
						darkMode ? (
							<MaterialSymbolsWbSunnyOutlineRounded className="user-menu-option-icon" />
						) : (
							<MaterialSymbolsDarkModeOutlineRounded className="user-menu-option-icon" />
						)
					}
					label={darkMode ? "Modo Claro" : "Modo Oscuro"}
					theme
					divider={isJuegosPelis}
					onClick={onToggleTheme}
				/>
				<MenuOption
					icon={
						<MdiTwitch className="user-menu-option-icon user-menu-twitch-icon" />
					}
					label="Iniciar con Twitch"
					primary
					divider
					onClick={onLogin}
				/>
			</>
		);
	}

	return (
		<>
			<MenuOption
				icon={
					darkMode ? (
						<MaterialSymbolsWbSunnyOutlineRounded className="user-menu-option-icon" />
					) : (
						<MaterialSymbolsDarkModeOutlineRounded className="user-menu-option-icon" />
					)
				}
				label={darkMode ? "Modo Claro" : "Modo Oscuro"}
				theme
				divider
				onClick={onToggleTheme}
			/>
			{isLoggedIn ? (
				<MenuOption
					icon={
						<MingcuteExitLine className="user-menu-option-icon" />
					}
					label="Cerrar Sesion"
					danger
					divider
					onClick={onLogout}
				/>
			) : (
				<MenuOption
					icon={
						<MdiTwitch className="user-menu-option-icon user-menu-twitch-icon" />
					}
					label="Iniciar con Twitch"
					primary
					onClick={onLogin}
				/>
			)}
		</>
	);
}

export default UserMenu;
