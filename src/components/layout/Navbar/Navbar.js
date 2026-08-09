import { Link, useLocation, useNavigate } from "react-router-dom";
import UserMenu from "./UserMenu";
import useLocalStorage from "../../../hooks/useLocalStorage";
import { useRefreshContext } from "../../../hooks/useRefresh";
import { STORAGE_KEYS } from "../../../constants/config";
import "./Navbar.css";

import { MaterialSymbolsWbSunnyOutlineRounded } from "../../icons/MaterialSymbolsWbSunnyOutlineRounded";
import { MaterialSymbolsDarkModeOutlineRounded } from "../../icons/MaterialSymbolsDarkModeOutlineRounded";
import { MaterialSymbolsOtherHousesOutlineRounded } from "../../icons/MaterialSymbolsOtherHousesOutlineRounded";
import { StreamlinePlumpGameboyRemix } from "../../icons/StreamlinePlumpGameboyRemix";
import { MaterialSymbolsVideocamRounded } from "../../icons/MaterialSymbolsVideocamRounded";
import { MaterialSymbolsJoystick } from "../../icons/MaterialSymbolsJoystick";
import { StreamlineFlexGamblingRemix } from "../../icons/StreamlineFlexGamblingRemix";
import { IcBaselineCatchingPokemon } from "../../icons/IcBaselineCatchingPokemon";
import { SolarMicrophoneBold } from "../../icons/SolarMicrophoneBold";

const NAV_LINKS = [
	{
		to: "/juegos",
		title: "Juegos",
		label: "Juegos",
		isActive: (p) => p === "/juegos" || p === "/juegos/recomendar",
	},
	{
		to: "/pelis",
		title: "Peliculas y Series",
		label: "Pelis",
		isActive: (p) => p === "/pelis" || p === "/pelis/recomendar",
	},
	{
		to: "/pokedex/kanto",
		title: "Pokedex",
		label: "Pokedex",
		isActive: (p) => p.includes("/pokedex"),
	},
	{
		to: "/gacha/gs",
		title: "Gacha",
		label: "Gacha",
		isActive: (p) => p.includes("/gacha"),
	},
	{
		to: "/gameboy",
		title: "GameBoy",
		label: "GameBoy",
		isActive: (p) => p === "/gameboy",
	},
	{
		to: "/tts",
		title: "Text-to-Speech",
		label: "TTS",
		isActive: (p) => p === "/tts",
	},
];

const MOBILE_PAIRS = [
	{
		id: "juegos-pelis",
		getActive: (p) =>
			[
				"/juegos",
				"/pelis",
				"/juegos/recomendar",
				"/pelis/recomendar",
			].includes(p),
		getLeft: (p) => p === "/juegos" || p === "/juegos/recomendar",
		getRight: (p) => p === "/pelis" || p === "/pelis/recomendar",
		icon: (p) =>
			p === "/pelis" || p === "/pelis/recomendar" ? (
				<MaterialSymbolsVideocamRounded className="nav-icon" />
			) : (
				<MaterialSymbolsJoystick className="nav-icon" />
			),
		toggle: (p, nav) => {
			if (p === "/juegos/recomendar") return nav("/juegos");
			if (p === "/pelis/recomendar") return nav("/pelis");
			nav(p === "/juegos" ? "/pelis" : "/juegos");
		},
		getTitle: (p) =>
			p === "/pelis" || p === "/pelis/recomendar"
				? "Ver Juegos"
				: "Ver Peliculas",
	},
	{
		id: "gameboy-tts",
		getActive: (p) => p === "/gameboy" || p === "/tts",
		getLeft: (p) => p === "/gameboy",
		getRight: (p) => p === "/tts",
		icon: (p) =>
			p === "/tts" ? (
				<SolarMicrophoneBold className="nav-icon" />
			) : (
				<StreamlinePlumpGameboyRemix className="nav-icon nav-icon-gameboy" />
			),
		toggle: (p, nav) => nav(p === "/gameboy" ? "/tts" : "/gameboy"),
		getTitle: (p) => (p === "/tts" ? "Ver GameBoy" : "Ver TTS"),
	},
	{
		id: "pokedex-gacha",
		getActive: (p) => p.includes("/pokedex") || p.includes("/gacha"),
		getLeft: (p) => p.includes("/pokedex"),
		getRight: (p) => p.includes("/gacha"),
		icon: (p) =>
			p.includes("/gacha") ? (
				<StreamlineFlexGamblingRemix className="nav-icon" />
			) : (
				<IcBaselineCatchingPokemon className="nav-icon" />
			),
		toggle: (p, nav) =>
			nav(p.includes("/pokedex") ? "/gacha/db" : "/pokedex/kanto"),
		getTitle: (p) => (p.includes("/gacha") ? "Ver Pokedex" : "Ver Gacha"),
	},
];

function isJuegosOrPelis(pathname) {
	return (
		pathname === "/juegos" ||
		pathname === "/pelis" ||
		pathname === "/juegos/recomendar" ||
		pathname === "/pelis/recomendar"
	);
}

function Navbar() {
	const location = useLocation();
	const navigate = useNavigate();
	const { triggerRefresh } = useRefreshContext();
	const [darkMode, setDarkMode] = useLocalStorage(
		STORAGE_KEYS.DARK_MODE,
		true,
	);
	const { pathname } = location;

	function handleLogoClick(e) {
		if (pathname === "/") {
			e.preventDefault();
			triggerRefresh();
		}
	}

	return (
		<nav className="navbar">
			<div className="navbar-container">
				<Link
					to="/"
					className="navbar-logo"
					title="Inicio"
					onClick={handleLogoClick}
				>
					<img
						src={
							darkMode
								? "/static/resources/logo.png"
								: "/static/resources/logo_black.png"
						}
						alt="Logo"
						onError={(e) => {
							e.target.style.display = "none";
							e.target.parentElement.textContent = "Logo";
						}}
					/>
				</Link>

				<ul className="navbar-links navbar-links-desktop">
					{NAV_LINKS.map((link) => {
						const isActive = link.isActive(pathname);
						return (
							<li key={link.to}>
								<Link
									to={link.to}
									className={isActive ? "active" : ""}
									title={link.title}
									onClick={(e) => {
										if (pathname === link.to) {
											e.preventDefault();
											triggerRefresh();
										}
									}}
								>
									<span className="nav-text">
										{link.label}
									</span>
								</Link>
							</li>
						);
					})}
				</ul>

				<div className="navbar-links navbar-links-mobile">
					<Link
						to="/"
						className={`navbar-mobile-button${pathname === "/" ? " active" : ""}`}
						title="Inicio"
					>
						<MaterialSymbolsOtherHousesOutlineRounded className="nav-icon" />
					</Link>

					{MOBILE_PAIRS.map((pair) => (
						<button
							key={pair.id}
							className={`navbar-mobile-button${pair.getActive(pathname) ? " active" : ""}${pair.getLeft(pathname) ? " active-left" : ""}${pair.getRight(pathname) ? " active-right" : ""}`}
							onClick={() => pair.toggle(pathname, navigate)}
							title={pair.getTitle(pathname)}
						>
							{pair.icon(pathname)}
						</button>
					))}

					<div className="navbar-mobile-button navbar-mobile-user">
						<UserMenu />
					</div>
				</div>

				<div className="navbar-right">
					{isJuegosOrPelis(pathname) && (
						<Link
							to={
								pathname.startsWith("/juegos")
									? "/juegos/recomendar"
									: "/pelis/recomendar"
							}
							className={`navbar-link-recomendar${pathname === "/juegos/recomendar" || pathname === "/pelis/recomendar" ? " active" : ""}`}
							title="Recomendar"
							onClick={(e) => {
								if (
									pathname === "/juegos/recomendar" ||
									pathname === "/pelis/recomendar"
								) {
									e.preventDefault();
									triggerRefresh();
								}
							}}
						>
							<span className="nav-text">Recomendaciones</span>
						</Link>
					)}

					<button
						className="navbar-theme-button"
						onClick={() => setDarkMode(!darkMode)}
						title={darkMode ? "Modo Claro" : "Modo Oscuro"}
					>
						{darkMode ? (
							<MaterialSymbolsWbSunnyOutlineRounded
								style={{ fontSize: "24px" }}
							/>
						) : (
							<MaterialSymbolsDarkModeOutlineRounded
								style={{ fontSize: "24px" }}
							/>
						)}
					</button>

					<UserMenu />
				</div>
			</div>
		</nav>
	);
}

export default Navbar;
