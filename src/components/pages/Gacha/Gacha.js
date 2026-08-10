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
import GachaCard from "../../common/GachaCard/GachaCard";
import GachaData from "../../common/GachaData/GachaData";
import UserRanking from "../../common/UserRanking/UserRanking";
import { DragonBall } from "../../icons/Gacha/DragonBall";
import { FromSoftware } from "../../icons/Gacha/FromSoftware";
import { GenshinImpact } from "../../icons/Gacha/GenshinImpact";
import { MonsterHunter } from "../../icons/Gacha/MonsterHunter";
import { OnePiece } from "../../icons/Gacha/OnePiece";
import { SmashBros } from "../../icons/Gacha/SmashBros";
import { MaterialSymbolsKidStar } from "../../icons/MaterialSymbolsKidStar";
import { MaterialSymbolsKidStarOutline } from "../../icons/MaterialSymbolsKidStarOutline";
import "../../common/UserSearch/UserSearch.css";
import "./Gacha.css";

const LEADERBOARD_PAGE_SIZE = 20;

const BANNER_ICONS = {
	DragonBall,
	FromSoftware,
	GenshinImpact,
	MonsterHunter,
	OnePiece,
	SmashBros,
};

function buildTieredGrid(chars, renderItem) {
	return chars.reduce((result, char, index, arr) => {
		const prev = index > 0 ? arr[index - 1] : null;
		const elements = [];
		if (!prev || prev.tier !== char.tier) {
			const tier = Math.min(5, Math.max(0, Number(char.tier) || 0));
			elements.push(
				<div
					key={`divider-${index}`}
					className="gacha-tier-divider"
				>
					<hr />
					<span className="gacha-tier-stars">
						{Array.from({ length: tier }, (_, i) => (
							<MaterialSymbolsKidStar key={`fill-${i}`} />
						))}
						{Array.from({ length: 5 - tier }, (_, i) => (
							<MaterialSymbolsKidStarOutline
								key={`outline-${i}`}
							/>
						))}
					</span>
					<hr />
				</div>,
			);
		}
		elements.push(renderItem(char, index));
		result.push(...elements);
		return result;
	}, []);
}

function Gacha() {
	const { banner } = useParams();
	const navigate = useNavigate();
	const { user } = useAuth();

	const { data: bannersData, loading: bannersLoading } = useApi(
		"/api/gacha/banners/activos",
	);

	const activeBanner = banner || "";
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
		"gacha_selectedUser",
		"",
	);
	const [selectedCharacter, setSelectedCharacter] = useState(null);

	const [cartasCache, setCartasCache] = useState({});
	const [cartasLoading, setCartasLoading] = useState(false);
	const [cartasRateLimitError, setCartasRateLimitError] = useState(null);
	const [cartasStatusError, setCartasStatusError] = useState(null);
	const cartasRequestRef = useRef(null);
	const cartasLoadingStartRef = useRef(0);
	const pendingRequestsRef = useRef(new Set());

	const banners = useMemo(() => {
		if (!bannersData || !bannersData.length) return [];
		return bannersData.map((b) => {
			const iconName = b.banner_nombre
				?.replace(/\s+/g, "")
				?.replace(/[^a-zA-Z]/g, "");
			const Icon =
				iconName && BANNER_ICONS[iconName]
					? BANNER_ICONS[iconName]
					: null;
			return {
				id: b.banner_id,
				nombre: b.banner_nombre,
				icon: Icon,
				totalPersonajes:
					b.total_personajes || (b.personajes || []).length || 0,
				personajes: b.personajes || [],
			};
		});
	}, [bannersData]);

	const totalGlobalPersonajes = useMemo(() => {
		return banners.reduce((sum, b) => sum + b.totalPersonajes, 0);
	}, [banners]);

	useEffect(() => {
		if (bannersLoading) return;
		if (!banners.length) return;
		if (!activeBanner || !banners.find((b) => b.id === activeBanner)) {
			navigate(`/gacha/${banners[0].id}`);
		}
	}, [activeBanner, banners, bannersLoading, navigate]);

	const characters = useMemo(() => {
		const activeBannerData = banners.find((b) => b.id === activeBanner);
		if (!activeBannerData || !activeBannerData.personajes.length) return [];
		return activeBannerData.personajes
			.sort((a, b) => {
				const tierOrder = { 5: 0, 4: 1, 3: 2 };
				const tA = tierOrder[a.personaje_tier] ?? 3;
				const tB = tierOrder[b.personaje_tier] ?? 3;
				if (tA !== tB) return tA - tB;
				return a.personaje_id - b.personaje_id;
			})
			.map((p) => ({
				id: String(p.personaje_id),
				name: p.personaje_nombre,
				tier: p.personaje_tier,
				imagenUrl: `/assets/gacha/${activeBanner}/${p.personaje_id}_low.webp`,
			}));
	}, [banners, activeBanner]);

	const totalCharactersBanner = characters.length;

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

				const res = await apiFetch(`/api/gacha/leaderboard?${params}`);
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

	const loadCartas = useCallback(async () => {
		if (!selectedUser || !activeBanner) return;

		const cacheKey = `${selectedUser}_${activeBanner}`;
		if (cartasCache[cacheKey]) return;
		if (pendingRequestsRef.current.has(cacheKey)) return;

		pendingRequestsRef.current.add(cacheKey);

		const requestId = Date.now().toString();
		cartasRequestRef.current = requestId;
		cartasLoadingStartRef.current = Date.now();
		setCartasLoading(true);
		setCartasRateLimitError(null);
		setCartasStatusError(null);

		try {
			const res = await apiFetch(
				`/api/gacha/usuario/${selectedUser}/banner/${activeBanner}?limit=60`,
			);
			if (!res.ok) {
				if (res.status === 429) {
					throw new Error("RATE_LIMIT");
				}
				throw new Error("Error al cargar cartas");
			}
			const data = await res.json();

			if (cartasRequestRef.current !== requestId) return;

			setCartasCache((prev) => ({
				...prev,
				[cacheKey]: data,
			}));
		} catch (err) {
			if (cartasRequestRef.current !== requestId) return;
			if (err.message === "RATE_LIMIT") {
				setCartasRateLimitError(RATE_LIMIT_MSG);
			} else {
				console.error("Error cargando cartas:", err);
				setCartasStatusError(API_STATUS_ERROR_MSG);
			}
		} finally {
			pendingRequestsRef.current.delete(cacheKey);
			if (cartasRequestRef.current === requestId) {
				const elapsed = Date.now() - cartasLoadingStartRef.current;
				const remaining = Math.max(0, 400 - elapsed);
				if (remaining > 0) {
					await new Promise((r) => setTimeout(r, remaining));
				}
				setCartasLoading(false);
			}
		}
	}, [selectedUser, activeBanner, cartasCache]);

	useEffect(() => {
		loadCartas();
	}, [loadCartas]);

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
			cartas: u.cartas,
		}));
	}, [leaderboardUsers]);

	const currentUser = users.find((u) => u.id === selectedUser);
	const currentUserName = currentUser?.nombre || "Usuario";
	const totalOwnedGlobal = currentUser?.cartas || 0;

	const currentCartas = useMemo(() => {
		const cacheKey = `${selectedUser}_${activeBanner}`;
		return cartasCache[cacheKey] || [];
	}, [cartasCache, selectedUser, activeBanner]);

	const characterGrid = useMemo(() => {
		const ownedIds = new Set(
			currentCartas
				.filter((c) => !c.eliminado_en)
				.map((c) => String(c.personaje_id).trim())
				.filter(Boolean),
		);

		return characters.map((char) => ({
			...char,
			owned: ownedIds.has(char.id),
		}));
	}, [characters, currentCartas]);

	const { ownedCount, tier5OwnedCount } = useMemo(() => {
		const owned = characterGrid.filter((c) => c.owned).length;
		const tier5Owned = characterGrid.filter(
			(c) => c.owned && String(c.tier) === "5",
		).length;
		return { ownedCount: owned, tier5OwnedCount: tier5Owned };
	}, [characterGrid]);

	const tier5Count = tier5OwnedCount;

	useEffect(() => {
		if (!selectedUser) return;
		const storageKey = `gacha_selectedCharacter_${selectedUser}_${activeBanner}`;
		const savedId = localStorage.getItem(storageKey);
		if (savedId) {
			const saved = characterGrid.find(
				(c) => c.owned && c.id === savedId,
			);
			if (saved) {
				setSelectedCharacter(saved);
				return;
			}
		}
		const firstOwned =
			characterGrid.find((c) => c.owned && String(c.tier) === "5") ||
			characterGrid.find((c) => c.owned && String(c.tier) === "4") ||
			characterGrid.find((c) => c.owned && String(c.tier) === "3");
		if (firstOwned) {
			setSelectedCharacter(firstOwned);
		} else {
			setSelectedCharacter(null);
		}
	}, [characterGrid, selectedUser, activeBanner]);

	const handleBannerChange = (bannerId) => {
		navigate(`/gacha/${bannerId}`);
	};

	const handleCharacterClick = (character) => {
		setSelectedCharacter(character);
		const storageKey = `gacha_selectedCharacter_${selectedUser}_${activeBanner}`;
		localStorage.setItem(storageKey, character.id);
	};

	const handleUserClick = (userId) => {
		setSelectedUser(userId);
		setUserSearchText("");
	};

	const completionPercentage =
		totalGlobalPersonajes > 0
			? ((totalOwnedGlobal / totalGlobalPersonajes) * 100).toFixed(0)
			: 0;

	return (
		<div className="main-container">
			<LoadingScreen
				visible={leaderboardLoading}
				error={rateLimitError || statusError}
			/>
			<div className="gacha-wrapper">
				<div className="gacha-data-container">
					<div className="top-section">
						<h2>Gacha de {currentUserName}</h2>
						<div className="top-section-h2-down">
							<span>
								<b>{totalOwnedGlobal}</b> obtenidos
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
						totalCharacters={totalGlobalPersonajes}
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
									totalCharacters={totalGlobalPersonajes}
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

					<GachaData
						selectedCharacter={selectedCharacter}
						banner={activeBanner}
						ownedCount={ownedCount}
						totalCharacters={totalCharactersBanner}
						tier5Count={tier5Count}
					/>
				</div>
				<div className="gacha-container">
					<div className="top-section gacha-top-section">
						<div className="gacha-top-controls">
							<div className="gacha-banner-buttons">
								{banners.map((b) => {
									const Icon = b.icon;
									return (
										<button
											key={b.id}
											className={`gacha-banner-button ${
												activeBanner === b.id
													? "active"
													: ""
											}`}
											onClick={() =>
												handleBannerChange(b.id)
											}
										>
											{Icon && (
												<Icon className="nav-icon" />
											)}
											<span className="nav-text">
												{b.nombre}
											</span>
										</button>
									);
								})}
							</div>
						</div>
					</div>
					<div className="inset-section">
						<div
							className="gacha-grid"
							style={{ position: "relative" }}
						>
							{(cartasLoading ||
								cartasRateLimitError ||
								cartasStatusError) && (
								<div className="gacha-grid-loading-overlay">
									{cartasRateLimitError ||
									cartasStatusError ? (
										<div className="grid-loading-error">
											<span className="grid-loading-error-icon">
												⚠️
											</span>
											<p>
												{cartasRateLimitError ||
													cartasStatusError}
											</p>
										</div>
									) : (
										<LoadingRing width={32} height={32} />
									)}
								</div>
							)}
							{cartasLoading
								? characters.length > 0
									? buildTieredGrid(
											characters,
											(_, index) => (
												<div
													key={`skel-${index}`}
													className="gacha-card-skeleton"
												/>
											),
										)
									: Array.from(
											{ length: 1 },
											(_, i) => (
												<div
													key={`skel-${i}`}
													className="gacha-card-skeleton"
												/>
											),
										)
								: buildTieredGrid(
										characterGrid,
										(char, index) => (
											<GachaCard
												key={`${char.id}-${index}`}
												character={char}
												onClick={handleCharacterClick}
											/>
										),
									)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Gacha;
