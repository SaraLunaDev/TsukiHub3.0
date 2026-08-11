import React, {
	useMemo,
	useState,
	useEffect,
	useCallback,
	useRef,
} from "react";
import {
	getRowId,
	normalizeItemRow,
	parseDuration,
	createItemSorter,
} from "../../../utils/itemHelpers";
import "../Recomendar/Recomendar.css";
import "./Items.css";
import ItemCaratula from "../../common/ItemCaratula/ItemCaratula";
import ItemImagenSmall from "../../common/ItemImagenSmall/ItemImagenSmall";
import { MaterialSymbolsAccountCircleFull } from "../../icons/MaterialSymbolsAccountCircleFull";
import LoadingRing from "../../icons/LoadingRing";
import LoadingScreen from "../../common/LoadingScreen/LoadingScreen";
import { RATE_LIMIT_MSG, API_STATUS_ERROR_MSG } from "../../../constants";
import SearchBar from "../../common/SearchBar/SearchBar";
import FilterSearchBar from "../../common/FilterSection/SearchBar";
import { useApi, apiFetch, clearApiCache } from "../../../hooks/useApi";
import { useAuth } from "../../../hooks/useAuth";
import { useItemSearch } from "../../../hooks/useItemSearch";

import FilterSection from "../../common/FilterSection/FilterSection";
import OrderFilter from "../../common/FilterSection/OrderFilter";
import YearFilter from "../../common/FilterSection/YearFilter";
import TypeFilter from "../../common/FilterSection/TypeFilter";
import GenreFilter from "../../common/FilterSection/GenreFilter";

const PAGE_SIZE = 100;

function RecomendarBase({ config }) {
	const { isAdmin, user, token } = useAuth();
	const userId = user?.id;

	const [showFilter, setShowFilter] = useState(false);
	const [order, setOrder] = useState("votes-desc");
	const [selectedYear, setSelectedYear] = useState("");
	const [selectedType, setSelectedType] = useState("");
	const [selectedGenre, setSelectedGenre] = useState("");
	const [searchText, setSearchText] = useState("");
	const [onlyMine, setOnlyMine] = useState(false);

	const [debouncedSearch, setDebouncedSearch] = useState("");
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(searchText), 350);
		return () => clearTimeout(timer);
	}, [searchText]);

	const endpointBase = React.useMemo(() => {
		const params = new URLSearchParams();
		params.set("limit", String(PAGE_SIZE));
		if (order && order !== "votes-desc") params.set("order", order);
		if (selectedYear) params.set("year", selectedYear);
		if (selectedType) params.set("plataforma", selectedType);
		if (selectedGenre) params.set("genre", selectedGenre);
		if (debouncedSearch) params.set("search", debouncedSearch);
		if (onlyMine && userId) params.set("usuario_id", String(userId));
		if (userId) params.set("current_user_id", String(userId));
		return `/api/items/tipo/${config.tipo}/estados/Recomendacion?${params}`;
	}, [
		config.tipo,
		order,
		selectedYear,
		selectedType,
		selectedGenre,
		debouncedSearch,
		onlyMine,
		userId,
	]);

	const [items, setItems] = useState([]);
	const [itemsCount, setItemsCount] = useState(0);
	const [itemsOffset, setItemsOffset] = useState(0);
	const [itemsLoading, setItemsLoading] = useState(true);
	const [itemsError, setItemsError] = useState(null);
	const [itemsRateLimitError, setItemsRateLimitError] = useState(null);
	const [itemsStatusError, setItemsStatusError] = useState(null);
	const [itemsLoadingMoreUI, setItemsLoadingMoreUI] = useState(false);
	const itemsLoadingMoreRef = useRef(false);
	const itemsHasMore = items.length < itemsCount;

	const initialLoadDoneRef = useRef(false);
	const loadingStartRef = useRef(0);

	const loadItems = useCallback(
		async (offset, append = false, silent = false) => {
			if (append) {
				itemsLoadingMoreRef.current = true;
				setItemsLoadingMoreUI(true);
			} else if (!silent) {
				loadingStartRef.current = Date.now();
				setItemsLoading(true);
			}
			setItemsError(null);
			setItemsRateLimitError(null);
			setItemsStatusError(null);
			try {
				const res = await apiFetch(`${endpointBase}&skip=${offset}`);
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
				setItemsCount(json.count || 0);
				if (append) {
					setItems((prev) => [...prev, ...(json.items || [])]);
				} else {
					setItems(json.items || []);
				}
				setItemsOffset(offset);
			} catch (err) {
				if (err.message === "RATE_LIMIT") {
					setItemsRateLimitError(RATE_LIMIT_MSG);
				} else {
					setItemsError(err.message);
					setItemsStatusError(API_STATUS_ERROR_MSG);
				}
			} finally {
				const elapsed = Date.now() - loadingStartRef.current;
				const remaining = Math.max(0, 400 - elapsed);
				if (remaining > 0) {
					await new Promise((r) => setTimeout(r, remaining));
				}
				setItemsLoading(false);
				if (!append) {
					initialLoadDoneRef.current = true;
				}
				itemsLoadingMoreRef.current = false;
				setItemsLoadingMoreUI(false);
			}
		},
		[endpointBase],
	);

	const lastLoadedRef = useRef(null);
	useEffect(() => {
		if (lastLoadedRef.current === endpointBase) return;
		lastLoadedRef.current = endpointBase;
		setItems([]);
		setItemsOffset(0);
		setItemsCount(0);
		loadItems(0);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [endpointBase]);

	const itemsScrollRef = useRef(null);
	const handleItemsScroll = useCallback(() => {
		const el = itemsScrollRef.current;
		if (!el) return;
		if (
			el.scrollHeight - el.scrollTop - el.clientHeight < 200 &&
			itemsHasMore &&
			!itemsLoadingMoreRef.current
		) {
			const newOffset = itemsOffset + PAGE_SIZE;
			loadItems(newOffset, true);
		}
	}, [itemsOffset, itemsHasMore, loadItems]);

	const { data: filterOptions } = useApi(
		`/api/items/tipo/${config.tipo}/estados/Recomendacion/filters`,
	);
	const filterYears = filterOptions?.years ?? [];
	const filterTypes = filterOptions?.types ?? [];
	const filterGenres = filterOptions?.genres ?? [];

	const {
		search,
		setSearch,
		searchResults,
		setSearchResults,
		searchLoading,
		searchError,
	} = useItemSearch(config);

	const [successMsg, setSuccessMsg] = useState("");
	const [selectedResult, setSelectedResult] = useState(null);

	const existingMatch = useMemo(() => {
		if (!selectedResult || !items || items.length === 0) return null;
		const selectedId = String(selectedResult.id || "").trim();
		return (
			items.find((row) => {
				const rowId = String(getRowId(row) || "").trim();
				return selectedId && rowId && selectedId === rowId;
			}) || null
		);
	}, [items, selectedResult]);

	const [comentario, setComentario] = useState("");
	const [selectedRecommendPlatform, setSelectedRecommendPlatform] =
		useState("");
	const [enviando, setEnviando] = useState(false);
	const [errorEnvio, setErrorEnvio] = useState("");

	const handleVote = useCallback(
		(id, newCount, voted) => {
			clearApiCache(endpointBase);
			setItems((prev) => {
				const next = prev.map((item) => {
					if (String(item.id) === String(id)) {
						return {
							...item,
							votos_count: newCount,
							...(voted !== undefined
								? { has_voted: voted }
								: {}),
						};
					}
					return item;
				});
				return [...next].sort(createItemSorter(order));
			});
		},
		[order, endpointBase],
	);

	const { labels } = config;

	return (
		<main className="main-container">
			{user && (
				<div
					className="top-section"
					style={{ marginTop: 8, marginBottom: 0 }}
				>
					<h2>{labels.titleRecomendar}</h2>
				</div>
			)}

			{user && (
				<div className="inset-section recomendar-section">
					<SearchBar
						placeholder={labels.searchPlaceholder}
						value={search}
						onChange={setSearch}
						className="recomendar-searchbar"
					/>
					{searchLoading && (
						<div
							style={{
								marginTop: 15,
								color: "var(--text-2)",
								fontSize: 14,
							}}
						>
							Buscando...
						</div>
					)}
					{successMsg && !searchLoading && (
						<div
							style={{
								marginTop: 15,
								color: "green",
								fontSize: 14,
							}}
						>
							{successMsg}
						</div>
					)}
					{searchError && (
						<div
							style={{
								marginTop: 8,
								color: "var(--error)",
								fontSize: 14,
							}}
						>
							{searchError}
						</div>
					)}
					{search &&
						searchResults.length > 0 &&
						!searchLoading &&
						!searchError && (
							<div className="autocomplete-list">
								{searchResults.map((result, idx) => (
									<div
										key={result.id || idx}
										className={`autocomplete-item${
											idx !== searchResults.length - 1
												? " autocomplete-item-border"
												: ""
										}${
											selectedResult &&
											selectedResult.id === result.id
												? " autocomplete-item-selected"
												: ""
										}`}
										onClick={() =>
											setSelectedResult(result)
										}
									>
										<ItemImagenSmall
											Imagen={
												result.imagen ||
												result.caratula ||
												result.Caratula
											}
											Nombre={
												result.nombre ||
												result.title ||
												result.name
											}
											Resumen={
												result.resumen ||
												result.overview
											}
											Trailer={result.trailer}
											Generos={
												Array.isArray(result.generos)
													? result.generos.join(", ")
													: result.generos
											}
											Fecha_Salida={
												result.fecha ||
												result.fecha_salida
											}
											Tipo={result.tipo || result.Tipo}
											Creador={
												result.creador || result.Creador
											}
											Nota_Global={
												result.nota_global ||
												result.Nota_Global
											}
											Caratula={
												result.caratula ||
												result.Caratula
											}
											Duracion={
												result.duracion ||
												result.Duracion
											}
										/>
									</div>
								))}
							</div>
						)}
					{selectedResult && (
						<div
							className="selected-result-preview"
							style={{ marginTop: 12, borderRadius: 8 }}
						>
							{config.needsPlatformSelector &&
								!existingMatch &&
								Array.isArray(selectedResult.tipo) &&
								selectedResult.tipo.length > 0 && (
									<div style={{ margin: "16px 0" }}>
										<label
											htmlFor="recommend-platform-select"
											style={{ fontWeight: 500 }}
										>
											Plataforma
										</label>
										<select
											id="recommend-platform-select"
											value={selectedRecommendPlatform}
											onChange={(e) =>
												setSelectedRecommendPlatform(
													e.target.value,
												)
											}
										>
											<option value="">
												Selecciona una plataforma...
											</option>
											{selectedResult.tipo.map(
												(platform, idx) => (
													<option
														key={platform + idx}
														value={platform}
													>
														{platform}
													</option>
												),
											)}
										</select>
									</div>
								)}
							<form
								className="recomendar-form"
								onSubmit={async (e) => {
									e.preventDefault();
									setEnviando(true);
									setErrorEnvio("");
									try {
										const tipoValue =
											config.tipo === "Juego"
												? selectedRecommendPlatform ||
													(Array.isArray(
														selectedResult.tipo,
													)
														? selectedResult.tipo[0]
														: "")
												: selectedResult.raw?.tipo ||
													selectedResult.tipo ||
													"";

										const res = await fetch("/api/items/", {
											method: "POST",
											headers: {
												"Content-Type":
													"application/json",
												...(token
													? { "X-User-Token": token }
													: {}),
											},
											body: JSON.stringify({
												tipo: config.tipo,
												external_id: selectedResult.id
													? parseInt(
															selectedResult.id,
														)
													: null,
												nombre:
													selectedResult.nombre ||
													selectedResult.title ||
													"",
												estado: "Recomendacion",
												plataforma: tipoValue || null,
												fecha: new Date().toLocaleDateString(
													"es-ES",
													{
														day: "2-digit",
														month: "2-digit",
														year: "numeric",
													},
												),
												duracion:
													parseDuration(
														selectedResult.duracion,
													) || null,
												youtube_url:
													selectedResult.url || "",
												caratula:
													selectedResult.caratula ||
													"",
												imagen:
													selectedResult.imagen || "",
												trailer:
													selectedResult.trailer ||
													"",
												generos: Array.isArray(
													selectedResult.generos,
												)
													? selectedResult.generos.join(
															",",
														)
													: selectedResult.generos ||
														"",
												resumen:
													selectedResult.resumen ||
													"",
												fecha_salida:
													selectedResult.fecha_salida ||
													selectedResult.raw
														?.fecha_salida ||
													"",
												nota_global:
													selectedResult.nota_global ||
													null,
												creador:
													selectedResult.creador ||
													"",
											}),
										});
										const created = await res.json();
										if (!res.ok)
											throw new Error(
												created.detail ||
													"Error al enviar",
											);

										if (comentario) {
											try {
												await fetch(
													"/api/comentarios/",
													{
														method: "POST",
														headers: {
															"Content-Type":
																"application/json",
															...(token
																? {
																		"X-User-Token":
																			token,
																	}
																: {}),
														},
														body: JSON.stringify({
															item_id: created.id,
															item_nombre:
																created.nombre,
															comentario,
														}),
													},
												);
											} catch {}
										}
										setComentario("");
										setSelectedResult(null);
										setSelectedRecommendPlatform("");
										setSearch("");
										setSearchResults([]);
										setSuccessMsg(
											"¡Recomendacion enviada! Muchas gracias",
										);
										setItems((prev) => [created, ...prev]);
										setItemsCount((prev) => prev + 1);
										clearApiCache(endpointBase);
										loadItems(0, false, true);
									} catch (err) {
										setErrorEnvio(err.message);
									} finally {
										setEnviando(false);
									}
								}}
							>
								{existingMatch && !isAdmin ? (
									<>
										<div className="recomendar-duplicate-message">
											{labels.duplicateMessage}
										</div>
										<div className="inset-section">
										<ItemCaratula
											{...normalizeItemRow(
												existingMatch,
											)}
											voteCount={
												existingMatch.votos_count || 0
											}
											hasVotedInitial={
												existingMatch.has_voted || false
											}
											onVote={handleVote}
											userSheet={{
												nombre:
													existingMatch.usuario_nombre ||
													"",
												pfp:
													existingMatch.usuario_imagen_perfil ||
													"",
											}}
											onRecommendationDeleted={(
													deletedId,
												) => {
													setItems((prev) =>
														prev.filter(
															(item) =>
																String(
																	item.id,
																) !==
																String(
																	deletedId,
																),
														),
													);
													setItemsCount((prev) =>
														Math.max(0, prev - 1),
													);
													clearApiCache(endpointBase);
													loadItems(0, false, true);
												}}
											/>
										</div>
									</>
								) : (
									<>
										{existingMatch && isAdmin && (
											<div className="recomendar-duplicate-message">
												{labels.duplicateMessage}
											</div>
										)}
										<div className="char-counter">
											{100 - comentario.length} caracteres
											restantes
										</div>
										<textarea
											placeholder="¿Algo que comentar sobre la recomendacion? (opcional)"
											value={comentario}
											onChange={(e) =>
												setComentario(e.target.value)
											}
											rows={3}
											maxLength={100}
											style={{ resize: "none" }}
											disabled={enviando}
										/>
										<button
											type="submit"
											disabled={
												enviando ||
												!user ||
												(config.needsPlatformSelector &&
													Array.isArray(
														selectedResult.tipo,
													) &&
													selectedResult.tipo.length >
														0 &&
													!selectedRecommendPlatform)
											}
										>
											{enviando
												? "Enviando..."
												: "Recomendar"}
										</button>
									</>
								)}
								{errorEnvio && (
									<div style={{ color: "red", marginTop: 8 }}>
										{errorEnvio}
									</div>
								)}
								{!user && (
									<div
										style={{
											color: "orange",
											marginTop: 8,
										}}
									>
										Debes iniciar sesion para recomendar.
									</div>
								)}
							</form>
						</div>
					)}
				</div>
			)}

			<div className="top-section" style={{ marginTop: 8 }}>
				<h2>{labels.title}</h2>
				<div className="top-section-h2-down">
					<span>
						<b>{itemsCount}</b> entrada
						{itemsCount === 1 ? "" : "s"}
					</span>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 8,
						}}
					>
						<FilterSection
							label="Filtrar"
							open={showFilter}
							onClick={() => setShowFilter((v) => !v)}
							divProps={{ style: { display: "none" } }}
						/>
					</div>
				</div>
			</div>

			{showFilter && (
				<div className="filter-section">
					{" "}
					<span
						className="filter-toggle-mine"
						style={{
							display: user ? "inline-flex" : "none",
							alignItems: "center",
							gap: 4,
							cursor: "pointer",
							fontSize: "0.88em",
							color: "var(--text-2)",
						}}
						role="button"
						tabIndex={0}
						onClick={() => setOnlyMine((v) => !v)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								setOnlyMine((v) => !v);
							}
						}}
						title={
							onlyMine
								? `Mostrando solo de ${user?.displayName || user?.nombre || "mí"} — clic para ver todos`
								: `Filtrar solo de ${user?.displayName || user?.nombre || "mí"}`
						}
						aria-pressed={onlyMine}
					>
						{user?.profileImage ? (
							<img
								src={user.profileImage}
								alt={user.displayName || ""}
								className={`filter-toggle-mine-avatar${onlyMine ? " filter-toggle-mine-active" : ""}`}
								style={{
									width: 18,
									height: 18,
									borderRadius: "50%",
									flexShrink: 0,
									objectFit: "cover",
								}}
							/>
						) : (
							<MaterialSymbolsAccountCircleFull
								className={`filter-toggle-mine-icon${onlyMine ? " filter-toggle-mine-active" : ""}`}
								style={{ width: 18, height: 18, flexShrink: 0 }}
							/>
						)}
					</span>
					<OrderFilter value={order} onChange={setOrder} />
					<YearFilter
						years={filterYears}
						selected={selectedYear}
						onChange={setSelectedYear}
					/>
					<TypeFilter
						options={filterTypes}
						selected={selectedType}
						onChange={setSelectedType}
						label={config.tipo === "Juego" ? "Plataforma" : "Tipo"}
					/>
					<GenreFilter
						options={filterGenres}
						value={selectedGenre}
						onChange={setSelectedGenre}
					/>
					<FilterSearchBar
						value={searchText}
						onChange={setSearchText}
						placeholder="Buscar..."
					/>
				</div>
			)}

			<LoadingScreen
				visible={itemsLoading && !initialLoadDoneRef.current}
				error={itemsRateLimitError || itemsStatusError}
			/>

			{itemsError ? (
				<div
					style={{
						color: "red",
						textAlign: "center",
						margin: "2em 0",
					}}
				>
					{itemsError}
				</div>
			) : (
				<div
					className="inset-section past-scroll-container"
					ref={itemsScrollRef}
					onScroll={handleItemsScroll}
				>
					{itemsLoading && initialLoadDoneRef.current ? (
						<div
							style={{
								textAlign: "center",
								padding: 48,
								color: "var(--text-2)",
							}}
						>
							<LoadingRing width={28} height={28} />
						</div>
					) : items.length > 0 ? (
						<>
							<div className={config.gridClass}>
								{items.map((row, idx) => (
									<ItemCaratula
										key={getRowId(row) || idx}
										{...normalizeItemRow(row)}
										voteCount={row.votos_count || 0}
										hasVotedInitial={row.has_voted || false}
										userSheet={{
											nombre: row.usuario_nombre || "",
											pfp:
												row.usuario_imagen_perfil || "",
										}}
										onVote={handleVote}
										onRecommendationDeleted={(
											deletedId,
										) => {
											setItems((prev) =>
												prev.filter(
													(item) =>
														String(item.id) !==
														String(deletedId),
												),
											);
											setItemsCount((prev) =>
												Math.max(0, prev - 1),
											);
											clearApiCache(endpointBase);
											loadItems(0, false, true);
										}}
										/>
								))}
							</div>
							{itemsLoadingMoreUI && (
								<div
									style={{
										textAlign: "center",
										padding: 12,
										color: "var(--text-2)",
									}}
								>
									Cargando más...
								</div>
							)}
						</>
					) : (
						!itemsLoading && (
							<div style={{ textAlign: "center", padding: 32 }}>
								No hay recomendaciones
							</div>
						)
					)}
				</div>
			)}
		</main>
	);
}

export default RecomendarBase;
