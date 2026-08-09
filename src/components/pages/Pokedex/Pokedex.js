import React, {
	useState,
	useEffect,
	useMemo,
	useCallback,
	useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApi, apiFetch } from "../../../hooks/useApi";
import { useAuth } from "../../../hooks/useAuth";
import useLocalStorage from "../../../hooks/useLocalStorage";
import SearchBar from "../../common/SearchBar";
import LoadingScreen from "../../common/LoadingScreen/LoadingScreen";
import { RATE_LIMIT_MSG, API_STATUS_ERROR_MSG } from "../../../constants";
import LoadingRing from "../../icons/LoadingRing";
import PokemonCard from "../../common/PokemonCard/PokemonCard";
import PokemonData from "../../common/PokemonData/PokemonData";
import UserRanking from "../../common/UserRanking/UserRanking";
import { Kanto } from "../../icons/Pokemon/Kanto";
import { Johto } from "../../icons/Pokemon/Johto";
import { Hoenn } from "../../icons/Pokemon/Hoenn";
import { Sinnoh } from "../../icons/Pokemon/Sinnoh";
import { Teselia } from "../../icons/Pokemon/Teselia";
import { Kalos } from "../../icons/Pokemon/Kalos";
import { Alola } from "../../icons/Pokemon/Alola";
import { Galar } from "../../icons/Pokemon/Galar";
import { Paldea } from "../../icons/Pokemon/Paldea";
import "../../common/UserSearch/UserSearch.css";
import "./Pokedex.css";

const TYPE_IMAGES = {};
const typeNames = [
	"bug",
	"dark",
	"dragon",
	"electric",
	"fairy",
	"fighting",
	"fire",
	"flying",
	"ghost",
	"grass",
	"ground",
	"ice",
	"normal",
	"poison",
	"psychic",
	"rock",
	"steel",
	"water",
];
typeNames.forEach((type) => {
	const img = new Image();
	img.src = `/static/resources/pokemon/types/${type}.png`;
	TYPE_IMAGES[type] = img;
});

const GENERATION_RANGES = {
	1: { start: 1, end: 151 },
	2: { start: 152, end: 251 },
	3: { start: 252, end: 386 },
	4: { start: 387, end: 493 },
	5: { start: 494, end: 649 },
	6: { start: 650, end: 721 },
	7: { start: 722, end: 809 },
	8: { start: 810, end: 905 },
	9: { start: 906, end: 1025 },
};

const REGIONS = [
	{ name: "Kanto", generation: 1, icon: Kanto },
	{ name: "Johto", generation: 2, icon: Johto },
	{ name: "Hoenn", generation: 3, icon: Hoenn },
	{ name: "Sinnoh", generation: 4, icon: Sinnoh },
	{ name: "Teselia", generation: 5, icon: Teselia },
	{ name: "Kalos", generation: 6, icon: Kalos },
	{ name: "Alola", generation: 7, icon: Alola },
	{ name: "Galar", generation: 8, icon: Galar },
	{ name: "Paldea", generation: 9, icon: Paldea },
];

const MAX_POKEMON_STATS = {
	HP: 255,
	Ataque: 190,
	Defensa: 230,
	AtaqueEsp: 194,
	DefensaEsp: 230,
	Velocidad: 180,
	Total: 720,
};

const LEADERBOARD_PAGE_SIZE = 20;

function Pokedex() {
	const { region } = useParams();
	const navigate = useNavigate();
	const { user } = useAuth();

	const { data: activeGenerationsData } = useApi(
		"/api/pokedex/generaciones/activas",
	);

	const [leaderboardUsers, setLeaderboardUsers] = useState([]);
	const [leaderboardCount, setLeaderboardCount] = useState(0);
	const leaderboardOffsetRef = useRef(0);
	const [leaderboardLoading, setLeaderboardLoading] = useState(true);
	const [leaderboardError, setLeaderboardError] = useState(null);
	const [rateLimitError, setRateLimitError] = useState(null);
	const [statusError, setStatusError] = useState(null);
	const leaderboardLoadingMoreRef = useRef(false);
	const [leaderboardLoadingMore, setLeaderboardLoadingMore] = useState(false);
	const leaderboardLoadingStartRef = useRef(0);
	const leaderboardHasMore = leaderboardUsers.length < leaderboardCount;

	const [userSearchText, setUserSearchText] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(userSearchText), 350);
		return () => clearTimeout(timer);
	}, [userSearchText]);

	const [isMobileRankingOpen, setIsMobileRankingOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useLocalStorage(
		"pokedex_selectedUser",
		"",
	);
	const [selectedPokemon, setSelectedPokemon] = useState(null);

	const [capturasCache, setCapturasCache] = useState({});
	const [capturasLoading, setCapturasLoading] = useState(false);
	const [capturasRateLimitError, setCapturasRateLimitError] = useState(null);
	const [capturasStatusError, setCapturasStatusError] = useState(null);
	const capturasRequestRef = useRef(null);
	const capturasLoadingStartRef = useRef(0);
	const pendingRequestsRef = useRef(new Set());

	const activeRegion = region || "kanto";
	const activeGeneration =
		REGIONS.find((r) => r.name.toLowerCase() === activeRegion)
			?.generation || 1;

	const activeGenerations = useMemo(() => {
		if (!activeGenerationsData || !activeGenerationsData.length) {
			return [];
		}
		return activeGenerationsData
			.map((gen) => gen.id)
			.filter((gen) => gen >= 1 && gen <= 9)
			.sort((a, b) => a - b);
	}, [activeGenerationsData]);

	useEffect(() => {
		const region = REGIONS.find(
			(r) => r.name.toLowerCase() === activeRegion,
		);
		if (!region) {
			navigate("/pokedex/kanto");
			return;
		}
		if (
			activeGenerations.length > 0 &&
			!activeGenerations.includes(region.generation)
		) {
			navigate("/pokedex/kanto");
		}
	}, [activeRegion, navigate, activeGenerations]);

	const totalPossiblePokemons = useMemo(() => {
		let total = 0;
		activeGenerations.forEach((gen) => {
			const range = GENERATION_RANGES[gen];
			if (range) {
				total += range.end - range.start + 1;
			}
		});
		return total;
	}, [activeGenerations]);

	const loadLeaderboard = useCallback(
		async (offset, append = false) => {
			if (append) {
				leaderboardLoadingMoreRef.current = true;
				setLeaderboardLoadingMore(true);
			} else {
				leaderboardLoadingStartRef.current = Date.now();
				setLeaderboardLoading(true);
			}
			setLeaderboardError(null);
			setRateLimitError(null);
			setStatusError(null);

			try {
				const params = new URLSearchParams();
				params.set("skip", String(offset));
				params.set("limit", String(LEADERBOARD_PAGE_SIZE));
				if (debouncedSearch) params.set("search", debouncedSearch);

				const res = await apiFetch(
					`/api/pokedex/leaderboard?${params}`,
				);
				if (!res.ok) {
					if (res.status === 429) {
						throw new Error("RATE_LIMIT");
					}
					const text = await res.text();
					let detail = text;
					try {
						detail = JSON.parse(text).detail || text;
					} catch {}
					throw new Error(detail || `HTTP ${res.status}`);
				}
				const json = await res.json();
				setLeaderboardCount(json.count);
				if (append) {
					setLeaderboardUsers((prev) => [
						...prev,
						...(json.users || []),
					]);
				} else {
					setLeaderboardUsers(json.users || []);
				}
				leaderboardOffsetRef.current = offset;
			} catch (err) {
				if (err.message === "RATE_LIMIT") {
					setRateLimitError(RATE_LIMIT_MSG);
				} else {
					setLeaderboardError(err.message);
					setStatusError(API_STATUS_ERROR_MSG);
				}
			} finally {
				const elapsed = Date.now() - leaderboardLoadingStartRef.current;
				const remaining = Math.max(0, 400 - elapsed);
				if (remaining > 0) {
					await new Promise((r) => setTimeout(r, remaining));
				}
				setLeaderboardLoading(false);
				leaderboardLoadingMoreRef.current = false;
				setLeaderboardLoadingMore(false);
			}
		},
		[debouncedSearch],
	);

	const lastSearchRef = useRef(null);
	useEffect(() => {
		if (lastSearchRef.current === debouncedSearch) return;
		lastSearchRef.current = debouncedSearch;
		setLeaderboardUsers([]);
		leaderboardOffsetRef.current = 0;
		setLeaderboardCount(0);
		loadLeaderboard(0);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedSearch]);

	const loadCapturas = useCallback(async () => {
		if (!selectedUser || !activeGeneration) return;

		const cacheKey = `${selectedUser}_${activeGeneration}`;
		if (capturasCache[cacheKey]) return;
		if (pendingRequestsRef.current.has(cacheKey)) return;

		pendingRequestsRef.current.add(cacheKey);

		const requestId = Date.now().toString();
		capturasRequestRef.current = requestId;
		capturasLoadingStartRef.current = Date.now();
		setCapturasLoading(true);
		setCapturasRateLimitError(null);
		setCapturasStatusError(null);

		try {
			const res = await apiFetch(
				`/api/pokedex/usuario/${selectedUser}/generacion/${activeGeneration}?limit=200`,
			);
			if (!res.ok) {
				if (res.status === 429) {
					throw new Error("RATE_LIMIT");
				}
				throw new Error("Error al cargar capturas");
			}
			const data = await res.json();

			if (capturasRequestRef.current !== requestId) return;

			setCapturasCache((prev) => ({
				...prev,
				[cacheKey]: data,
			}));
		} catch (err) {
			if (capturasRequestRef.current !== requestId) return;
			if (err.message === "RATE_LIMIT") {
				setCapturasRateLimitError(RATE_LIMIT_MSG);
			} else {
				console.error("Error cargando capturas:", err);
				setCapturasStatusError(API_STATUS_ERROR_MSG);
			}
		} finally {
			pendingRequestsRef.current.delete(cacheKey);
			if (capturasRequestRef.current === requestId) {
				const elapsed = Date.now() - capturasLoadingStartRef.current;
				const remaining = Math.max(0, 400 - elapsed);
				if (remaining > 0) {
					await new Promise((r) => setTimeout(r, remaining));
				}
				setCapturasLoading(false);
			}
		}
	}, [selectedUser, activeGeneration, capturasCache]);

	useEffect(() => {
		loadCapturas();
	}, [loadCapturas]);

	const handleLeaderboardScroll = useCallback(
		(e) => {
			const el = e.target;
			if (!el) return;
			if (
				el.scrollHeight - el.scrollTop - el.clientHeight < 200 &&
				leaderboardHasMore &&
				!leaderboardLoadingMoreRef.current
			) {
				const newOffset =
					leaderboardOffsetRef.current + LEADERBOARD_PAGE_SIZE;
				loadLeaderboard(newOffset, true);
			}
		},
		[leaderboardHasMore, loadLeaderboard],
	);

	const defaultSelectedRef = useRef(false);
	useEffect(() => {
		if (defaultSelectedRef.current) return;
		if (leaderboardUsers.length === 0) return;
		if (selectedUser) {
			defaultSelectedRef.current = true;
			return;
		}

		if (user?.username) {
			const loggedUser = leaderboardUsers.find(
				(u) =>
					String(u.nombre).toLowerCase() ===
					user.username.toLowerCase(),
			);
			if (loggedUser) {
				setSelectedUser(String(loggedUser.id));
				defaultSelectedRef.current = true;
				return;
			}
		}

		const topUser = leaderboardUsers[0];
		if (topUser) {
			setSelectedUser(String(topUser.id));
		}
		defaultSelectedRef.current = true;
	}, [leaderboardUsers, selectedUser, setSelectedUser, user]);

	useEffect(() => {
		defaultSelectedRef.current = false;
	}, [debouncedSearch]);

	useEffect(() => {
		if (!userSearchText) return;
		if (leaderboardUsers.length === 1) {
			const newId = String(leaderboardUsers[0].id);
			if (selectedUser !== newId) {
				setSelectedUser(newId);
			}
		} else if (leaderboardUsers.length > 1) {
			const exactMatch = leaderboardUsers.find(
				(u) =>
					String(u.nombre).toLowerCase() ===
					userSearchText.toLowerCase(),
			);
			if (exactMatch && selectedUser !== String(exactMatch.id)) {
				setSelectedUser(String(exactMatch.id));
			}
		}
	}, [userSearchText, leaderboardUsers, setSelectedUser, selectedUser]);

	const users = useMemo(() => {
		return leaderboardUsers.map((u) => ({
			id: String(u.id),
			nombre: u.nombre,
			pfp:
				u.imagen_perfil ||
				`https://decapi.me/twitch/avatar/${u.nombre}`,
			pokemons: u.pokemons,
		}));
	}, [leaderboardUsers]);

	const currentUser = users.find((u) => u.id === selectedUser);
	const currentUserName = currentUser?.nombre || "Usuario";
	const totalCaptured = currentUser?.pokemons || 0;
	const completionPercentage =
		totalPossiblePokemons > 0
			? ((totalCaptured / totalPossiblePokemons) * 100).toFixed(0)
			: 0;

	const currentCapturas = useMemo(() => {
		const cacheKey = `${selectedUser}_${activeGeneration}`;
		return capturasCache[cacheKey] || [];
	}, [capturasCache, selectedUser, activeGeneration]);

	const getPokemonUrls = (pokemonId, shiny = false) => {
		const baseUrl =
			"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
		const shinyPath = shiny ? "shiny/" : "";
		return {
			staticUrl: `${baseUrl}/${shinyPath}${pokemonId}.png`,
			gifUrl: `${baseUrl}/versions/generation-v/black-white/animated/${shinyPath}${pokemonId}.gif`,
		};
	};

	const pokemonGrid = useMemo(() => {
		const { start, end } = GENERATION_RANGES[activeGeneration];
		const generationSize = end - start + 1;

		return Array.from({ length: generationSize }, (_, index) => {
			const id = start + index;
			const matchedPokemon = currentCapturas.find(
				(p) =>
					parseInt(String(p.pokemon_id || ""), 10) === id &&
					String(p.usuario_id || "").trim() === selectedUser,
			);

			if (!matchedPokemon) {
				return {
					id: id.toString(),
					captured: false,
					shiny: false,
					...getPokemonUrls(id, false),
				};
			}

			const isShiny =
				String(matchedPokemon.shiny || "").toLowerCase() === "true";
			return {
				pokemonId: String(matchedPokemon.pokemon_id || "").trim(),
				pokemonName: String(matchedPokemon.nombre_pokemon || "").trim(),
				tipo1: String(matchedPokemon.tipo1 || "").trim(),
				tipo2: String(matchedPokemon.tipo2 || "").trim(),
				movimiento1: String(matchedPokemon.movimiento1 || "").trim(),
				movimiento2: String(matchedPokemon.movimiento2 || "").trim(),
				movimiento3: String(matchedPokemon.movimiento3 || "").trim(),
				movimiento4: String(matchedPokemon.movimiento4 || "").trim(),
				Usuario: String(matchedPokemon.usuario_id || "").trim(),
				Shiny: String(matchedPokemon.shiny || "").trim(),
				HP: String(matchedPokemon.hp || "").trim(),
				Ataque: String(matchedPokemon.ataque || "").trim(),
				Defensa: String(matchedPokemon.defensa || "").trim(),
				AtaqueEsp: String(matchedPokemon.ataque_esp || "").trim(),
				DefensaEsp: String(matchedPokemon.defensa_esp || "").trim(),
				Velocidad: String(matchedPokemon.velocidad || "").trim(),
				ivHP: String(matchedPokemon.iv_hp || "").trim(),
				ivAtaque: String(matchedPokemon.iv_ataque || "").trim(),
				ivDefensa: String(matchedPokemon.iv_defensa || "").trim(),
				ivAtaqueEsp: String(matchedPokemon.iv_ataque_esp || "").trim(),
				ivDefensaEsp: String(
					matchedPokemon.iv_defensa_esp || "",
				).trim(),
				ivVelocidad: String(matchedPokemon.iv_velocidad || "").trim(),
				XP: String(matchedPokemon.xp || "").trim(),
				Peso: String(matchedPokemon.peso || "").trim(),
				id: id.toString(),
				captured: true,
				shiny: isShiny,
				...getPokemonUrls(id, isShiny),
			};
		});
	}, [currentCapturas, selectedUser, activeGeneration]);

	const { capturedCount, shinyCount, totalPokemon } = useMemo(() => {
		const { end } = GENERATION_RANGES[activeGeneration];
		const total = end - GENERATION_RANGES[activeGeneration].start + 1;
		const captured = pokemonGrid.filter(
			(p) => p.captured && p.id && parseInt(p.id) <= end,
		).length;
		const shinies = pokemonGrid.filter(
			(p) => p.shiny && p.id && parseInt(p.id) <= end,
		).length;
		return {
			capturedCount: captured,
			shinyCount: shinies,
			totalPokemon: total,
		};
	}, [pokemonGrid, activeGeneration]);

	useEffect(() => {
		if (!selectedUser) return;
		const storageKey = `pokedex_selectedPokemon_${selectedUser}_${activeRegion}`;
		const savedPokemonId = localStorage.getItem(storageKey);
		if (savedPokemonId) {
			const savedPokemon = pokemonGrid.find(
				(p) => p.captured && p.id === savedPokemonId,
			);
			if (savedPokemon) {
				setSelectedPokemon(savedPokemon);
				return;
			}
		}
		const firstCaptured = pokemonGrid.find((p) => p.captured);
		if (firstCaptured) {
			setSelectedPokemon(firstCaptured);
		} else {
			setSelectedPokemon(null);
		}
	}, [pokemonGrid, selectedUser, activeRegion]);

	const handleRegionChange = (newRegion) => {
		navigate(`/pokedex/${newRegion}`);
	};

	const handlePokemonClick = (pokemon) => {
		setSelectedPokemon(pokemon);
		const storageKey = `pokedex_selectedPokemon_${selectedUser}_${activeRegion}`;
		localStorage.setItem(storageKey, pokemon.id);
	};

	const handleUserClick = (userId) => {
		setSelectedUser(userId);
		setUserSearchText("");
	};

	return (
		<div className="main-container">
			<LoadingScreen
				visible={leaderboardLoading}
				error={rateLimitError || statusError}
			/>
			<div className="pokedex-wrapper">
				<div className="pokemon-data-container">
					<div className="top-section">
						<h2>Pokedex de {currentUserName}</h2>
						<div className="top-section-h2-down">
							<span>
								<b>{totalCaptured}</b> capturados
							</span>
							<span>
								<b>{completionPercentage}%</b>
							</span>
						</div>
					</div>

					<div className="user-search-above-ranking">
						<SearchBar
							placeholder="Buscar usuario..."
							value={userSearchText}
							onChange={setUserSearchText}
							showChevronButton={true}
							onChevronClick={() =>
								setIsMobileRankingOpen(!isMobileRankingOpen)
							}
							isChevronOpen={isMobileRankingOpen}
						/>
					</div>

					<UserRanking
						users={users}
						selectedUser={selectedUser}
						handleUserClick={handleUserClick}
						totalCharacters={totalPossiblePokemons}
						className="desktop-only"
						onScroll={handleLeaderboardScroll}
						hasMore={leaderboardHasMore}
						loadingMore={leaderboardLoadingMore}
					/>

					{isMobileRankingOpen && (
						<div
							className="mobile-ranking-popup-overlay"
							onClick={() => setIsMobileRankingOpen(false)}
						>
							<div
								className="mobile-ranking-popup"
								onClick={(e) => e.stopPropagation()}
							>
								<div className="mobile-ranking-header">
									<h3>Ranking de Usuarios</h3>
									<button
										className="mobile-ranking-close"
										onClick={() =>
											setIsMobileRankingOpen(false)
										}
									>
										✕
									</button>
								</div>
								<UserRanking
									users={users}
									selectedUser={selectedUser}
									handleUserClick={(userId) => {
										handleUserClick(userId);
										setIsMobileRankingOpen(false);
									}}
									totalCharacters={totalPossiblePokemons}
									className="mobile-ranking-content"
									onScroll={handleLeaderboardScroll}
									hasMore={leaderboardHasMore}
									loadingMore={leaderboardLoadingMore}
								/>
							</div>
						</div>
					)}

					{leaderboardError && (
						<div
							style={{
								color: "red",
								textAlign: "center",
								padding: 8,
								fontSize: 13,
							}}
						>
							Error: {leaderboardError}
						</div>
					)}

					<PokemonData
						selectedPokemon={selectedPokemon}
						maxStats={MAX_POKEMON_STATS}
						capturedCount={capturedCount}
						totalPokemon={totalPokemon}
						shinyCount={shinyCount}
					/>
				</div>
				<div className="pokedex-container">
					<div className="top-section pokedex-top-section">
						<div className="pokedex-top-controls">
							<div className="pokedex-region-buttons">
								{REGIONS.map((reg) => {
									const isActive = activeGenerations.includes(
										reg.generation,
									);
									const IconComponent = reg.icon;
									return (
										<button
											key={reg.generation}
											className={`pokedex-region-button ${
												activeRegion ===
												reg.name.toLowerCase()
													? "active"
													: ""
											}${!isActive ? " locked" : ""}`}
											disabled={!isActive}
											title={
												!isActive
													? `${reg.name} no disponible`
													: reg.name
											}
											onClick={() =>
												isActive &&
												handleRegionChange(
													reg.name.toLowerCase(),
												)
											}
										>
											<IconComponent className="nav-icon" />
											<span className="nav-text">
												{reg.name}
											</span>
										</button>
									);
								})}
							</div>
						</div>
					</div>
					<div className="inset-section">
						<div
							className="pokemon-grid"
							style={{ position: "relative" }}
						>
							{(capturasLoading ||
								capturasRateLimitError ||
								capturasStatusError) && (
								<div className="pokemon-grid-loading-overlay">
									{capturasRateLimitError ||
									capturasStatusError ? (
										<div className="grid-loading-error">
											<span className="grid-loading-error-icon">
												⚠️
											</span>
											<p>
												{capturasRateLimitError ||
													capturasStatusError}
											</p>
										</div>
									) : (
										<LoadingRing width={32} height={32} />
									)}
								</div>
							)}
							{capturasLoading
								? Array.from(
										{
											length:
												GENERATION_RANGES[
													activeGeneration
												].end -
												GENERATION_RANGES[
													activeGeneration
												].start +
												1,
										},
										(_, i) => (
											<div
												key={`skel-${i}`}
												className="pokemon-card-skeleton"
											/>
										),
									)
								: pokemonGrid.map((pokemon, index) => (
										<PokemonCard
											key={`${pokemon.id || "empty"}-${index}`}
											pokemon={pokemon}
											onClick={handlePokemonClick}
										/>
									))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Pokedex;
