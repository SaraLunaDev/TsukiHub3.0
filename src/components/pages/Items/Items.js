import React, { useState, useEffect, useCallback, useRef } from "react";
import LoadingScreen from "../../common/LoadingScreen/LoadingScreen";
import { RATE_LIMIT_MSG, API_STATUS_ERROR_MSG } from "../../../constants";
import LoadingRing from "../../icons/LoadingRing";
import { normalizeItemRow } from "../../../utils/itemHelpers";
import "./Items.css";
import ItemCaratula from "../../common/ItemCaratula/ItemCaratula";
import { CarruselImagen } from "../../common/Carousel/CarruselImagen";
import { Carousel } from "../../common/Carousel/Carousel";
import "../../common/Carousel/Carousel.css";
import { useApi, apiFetch, clearApiCache } from "../../../hooks/useApi";

import FilterSection from "../../common/FilterSection/FilterSection";
import YearFilter from "../../common/FilterSection/YearFilter";
import OrderFilter from "../../common/FilterSection/OrderFilter";
import TypeFilter from "../../common/FilterSection/TypeFilter";
import SearchBar from "../../common/FilterSection/SearchBar";
import GenreFilter from "../../common/FilterSection/GenreFilter";

const PAGE_SIZE = 100;

function Items({ config }) {
	const {
		data: ahoraData,
		loading: ahoraLoading,
		error: ahoraError,
		rateLimitError: ahoraRateLimitError,
		statusError: ahoraStatusError,
		refetch: ahoraRefetch,
	} = useApi(
		`/api/items/tipo/${config.tipo}/estados/Ahora?limit=${PAGE_SIZE}`,
	);

	const {
		data: planeoData,
		loading: planeoLoading,
		error: planeoError,
		rateLimitError: planeoRateLimitError,
		statusError: planeoStatusError,
		refetch: planeoRefetch,
	} = useApi(
		`/api/items/tipo/${config.tipo}/estados/Planeo?limit=${PAGE_SIZE}`,
	);

	const [pastItems, setPastItems] = useState([]);
	const [pastCount, setPastCount] = useState(0);
	const pastOffsetRef = useRef(0);
	const [pastLoading, setPastLoading] = useState(true);
	const [pastError, setPastError] = useState(null);
	const [pastRateLimitError, setPastRateLimitError] = useState(null);
	const [pastStatusError, setPastStatusError] = useState(null);
	const pastLoadingMoreRef = useRef(false);
	const [pastLoadingMoreUI, setPastLoadingMoreUI] = useState(false);
	const pastLoadingStartRef = useRef(0);
	const pastHasMore = pastItems.length < pastCount;

	const ahoraItems = ahoraData?.items ?? [];
	const ahoraCount = ahoraData?.count ?? 0;
	const planeoItems = planeoData?.items ?? [];
	const planeoCount = planeoData?.count ?? 0;

	const [nowIndex, setNowIndex] = useState(0);
	const [planIndex, setPlanIndex] = useState(0);
	const [timerKey, setTimerKey] = useState(0);
	const maxLenRef = useRef(0);
	maxLenRef.current = Math.min(ahoraItems.length, planeoItems.length);

	useEffect(() => {
		if (maxLenRef.current <= 1) return;
		const timer = setInterval(() => {
			setNowIndex((i) => (i >= maxLenRef.current - 1 ? 0 : i + 1));
			setPlanIndex((i) => (i >= maxLenRef.current - 1 ? 0 : i + 1));
		}, 10000);
		return () => clearInterval(timer);
	}, [ahoraItems.length, planeoItems.length, timerKey]);

	const handleNowChange = useCallback((newIndex) => {
		setNowIndex(newIndex);
		setTimerKey((k) => k + 1);
	}, []);
	const handlePlanChange = useCallback((newIndex) => {
		setPlanIndex(newIndex);
		setTimerKey((k) => k + 1);
	}, []);
	const handleUserInteract = useCallback(() => {
		setTimerKey((k) => k + 1);
	}, []);

	const [showFilter, setShowFilter] = useState(false);
	const [selectedYear, setSelectedYear] = useState("");
	const [order, setOrder] = useState("desc");
	const [selectedType, setSelectedType] = useState("");
	const [searchText, setSearchText] = useState("");
	const [selectedGenre, setSelectedGenre] = useState("");

	const [debouncedSearch, setDebouncedSearch] = useState("");
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(searchText), 350);
		return () => clearTimeout(timer);
	}, [searchText]);

	const { data: filterOptions } = useApi(
		`/api/items/tipo/${config.tipo}/estados/Pasado/filters`,
	);
	const years = filterOptions?.years ?? [];
	const typeOptions = filterOptions?.types ?? [];
	const genreOptions = filterOptions?.genres ?? [];

	const pastEndpointBase = React.useMemo(() => {
		const params = new URLSearchParams();
		params.set("limit", String(PAGE_SIZE));
		if (selectedYear) params.set("year", selectedYear);
		if (selectedType) params.set("plataforma", selectedType);
		if (selectedGenre) params.set("genre", selectedGenre);
		if (debouncedSearch) params.set("search", debouncedSearch);
		if (order && order !== "desc") params.set("order", order);
		return `/api/items/tipo/${config.tipo}/estados/Pasado?${params}`;
	}, [
		config.tipo,
		selectedYear,
		selectedType,
		selectedGenre,
		debouncedSearch,
		order,
	]);

	const loadPastItems = useCallback(
		async (offset, append = false, silent = false) => {
			if (append) {
				pastLoadingMoreRef.current = true;
				setPastLoadingMoreUI(true);
			} else if (!silent) {
				pastLoadingStartRef.current = Date.now();
				setPastLoading(true);
			}
			setPastError(null);
			setPastRateLimitError(null);
			setPastStatusError(null);
			try {
				const res = await apiFetch(
					`${pastEndpointBase}&skip=${offset}`,
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
				setPastCount(json.count);
				if (append) {
					setPastItems((prev) => [...prev, ...(json.items || [])]);
				} else {
					setPastItems(json.items || []);
				}
				pastOffsetRef.current = offset;
			} catch (err) {
				if (err.message === "RATE_LIMIT") {
					setPastRateLimitError(RATE_LIMIT_MSG);
				} else {
					setPastError(err.message);
					setPastStatusError(API_STATUS_ERROR_MSG);
				}
			} finally {
				const elapsed = Date.now() - pastLoadingStartRef.current;
				const remaining = Math.max(0, 400 - elapsed);
				if (remaining > 0) {
					await new Promise((r) => setTimeout(r, remaining));
				}
				setPastLoading(false);
				pastLoadingMoreRef.current = false;
				setPastLoadingMoreUI(false);
			}
		},
		[pastEndpointBase],
	);

	const refetch = useCallback(() => {
		ahoraRefetch();
		planeoRefetch();
		clearApiCache(pastEndpointBase);
		loadPastItems(0, false, true);
	}, [ahoraRefetch, planeoRefetch, loadPastItems, pastEndpointBase]);

	const lastLoadedEndpointRef = useRef(null);
	useEffect(() => {
		if (lastLoadedEndpointRef.current === pastEndpointBase) return;
		lastLoadedEndpointRef.current = pastEndpointBase;
		setPastItems([]);
		pastOffsetRef.current = 0;
		setPastCount(0);
		loadPastItems(0);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pastEndpointBase]);

	const pastScrollRef = useRef(null);

	const handlePastScroll = useCallback(() => {
		const el = pastScrollRef.current;
		if (!el) return;
		if (
			el.scrollHeight - el.scrollTop - el.clientHeight < 200 &&
			pastHasMore &&
			!pastLoadingMoreRef.current
		) {
			const newOffset = pastOffsetRef.current + PAGE_SIZE;
			loadPastItems(newOffset, true);
		}
	}, [pastHasMore, loadPastItems]);

	const { labels, typeFilterLabel, gridClass } = config;

	const anyLoading = ahoraLoading || planeoLoading;
	const anyError = ahoraError || planeoError || pastError;
	const anyRateLimitError =
		ahoraRateLimitError || planeoRateLimitError || pastRateLimitError;
	const anyStatusError =
		ahoraStatusError || planeoStatusError || pastStatusError;

	const [showLoading, setShowLoading] = useState(true);
	const loadingStartRef = useRef(Date.now());
	const MIN_LOADING_VISIBLE_MS = 600;
	useEffect(() => {
		if (!anyLoading && !pastLoading) {
			const elapsed = Date.now() - loadingStartRef.current;
			const delay = Math.max(0, MIN_LOADING_VISIBLE_MS - elapsed);
			const timer = setTimeout(() => setShowLoading(false), delay);
			return () => clearTimeout(timer);
		}
	}, [anyLoading, pastLoading]);

	return (
		<div className="main-container">
			{(ahoraItems.length > 0 || planeoItems.length > 0) && (
				<div style={{ display: "flex", gap: 24 }}>
					<div className="hide-mobile" style={{ flex: 0 }}>
						<div className="top-section">
							<h2>{labels.nowTitle}</h2>
							<div className="top-section-h2-down">
								<span>
									<b>{ahoraCount}</b> entrada
									{ahoraCount === 1 ? "" : "s"}
								</span>
							</div>
						</div>
						<div className="inset-section">
							<Carousel
								items={ahoraItems}
								index={nowIndex}
								onIndexChange={handleNowChange}
								onInteract={handleUserInteract}
								renderItem={(row, idx) => (
									<ItemCaratula
										key={
											labels.carouselKeyPrefix + "-" + idx
										}
										{...normalizeItemRow(row)}
									/>
								)}
							/>
						</div>
					</div>
					<div style={{ flex: 1 }}>
						<div className="top-section">
							<h2>{labels.planTitle}</h2>
							<div className="top-section-h2-down">
								<span>
									<b>{planeoCount}</b> entrada
									{planeoCount === 1 ? "" : "s"}
								</span>
							</div>
						</div>
						<div className="inset-section">
							<CarruselImagen
								items={planeoItems.map(normalizeItemRow)}
								index={planIndex}
								onIndexChange={handlePlanChange}
								onInteract={handleUserInteract}
							/>
						</div>
					</div>
				</div>
			)}

			<div className="top-section" style={{ marginTop: 16 }}>
				<h2>{labels.completedTitle}</h2>
				<div className="top-section-h2-down">
					<span>
						<b>{pastCount}</b> entrada
						{pastCount === 1 ? "" : "s"}
					</span>
					<FilterSection
						label="Filtrar"
						open={showFilter}
						onClick={() => setShowFilter((v) => !v)}
						divProps={{ style: { display: "none" } }}
					/>
				</div>
			</div>

			{showFilter && (
				<div className="filter-section">
					<OrderFilter value={order} onChange={setOrder} />
					<YearFilter
						years={years}
						selected={selectedYear}
						onChange={setSelectedYear}
					/>
					<TypeFilter
						options={typeOptions}
						selected={selectedType}
						onChange={setSelectedType}
						label={typeFilterLabel}
					/>
					<GenreFilter
						options={genreOptions}
						value={selectedGenre}
						onChange={setSelectedGenre}
					/>
					<SearchBar
						value={searchText}
						onChange={setSearchText}
						placeholder="Buscar..."
					/>
				</div>
			)}

			<LoadingScreen
				visible={showLoading}
				error={anyRateLimitError || anyStatusError}
			/>

			{anyError ? (
				<div
					style={{
						color: "red",
						textAlign: "center",
						margin: "2em 0",
					}}
				>
					{anyError}
				</div>
			) : (
				<div
					className="inset-section past-scroll-container"
					ref={pastScrollRef}
					onScroll={handlePastScroll}
				>
					{pastLoading ? (
						<div
							style={{
								textAlign: "center",
								padding: 48,
								color: "var(--text-2)",
							}}
						>
							<LoadingRing width={28} height={28} />
						</div>
					) : pastItems.length > 0 ? (
						<>
							<div className={gridClass}>
								{pastItems.map((row, idx) => (
									<ItemCaratula
										key={row.id || idx}
										{...normalizeItemRow(row)}
										userSheet={
											row.usuario_nombre
												? {
														nombre: row.usuario_nombre,
														pfp:
															row.usuario_imagen_perfil ||
															"",
													}
												: null
										}
										onRecommendationDeleted={(
											deletedId,
										) => {
											setPastItems((prev) =>
												prev.filter(
													(item) =>
														String(item.id) !==
														String(deletedId),
												),
											);
											setPastCount((prev) =>
												Math.max(0, prev - 1),
											);
											refetch();
										}}
									/>
								))}
							</div>
							{pastLoadingMoreUI && (
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
						<div
							style={{
								textAlign: "center",
								padding: 15,
								color: "var(--text-2)",
							}}
						>
							{labels.emptyMessage}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default Items;
