import React, { useState, useMemo, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { useAuth } from "../../../hooks/useAuth";
import { useDebouncedSearch } from "../../../hooks/useDebouncedSearch";
import { useEmoteLayout } from "../../../hooks/useEmoteLayout";
import { useAchievementLayout } from "../../../hooks/useAchievementLayout";
import { useDashboardData } from "../../../hooks/useDashboardData";
import LoadingScreen from "../../common/LoadingScreen/LoadingScreen";

import { MdiChevronUp } from "../../icons/MdiChevronUp";
import { MdiChevronDown } from "../../icons/MdiChevronDown";
import { MdiChevronDoubleDown } from "../../icons/MdiChevronDoubleDown";
import { MaterialSymbolsAndroidMessages } from "../../icons/MaterialSymbolsAndroidMessages";
import { IonTicket } from "../../icons/IonTicket";
import { SolarFireBold } from "../../icons/SolarFireBold";
import { TablerDiamondFilled } from "../../icons/TablerDiamondFilled";
import StatTable from "../../common/StatTable/StatTable";
import AchievementSection from "../../common/AchievementSection/AchievementSection";
import StatSection from "../../common/StatSection/StatSection";
import SearchBar from "../../common/SearchBar";
import EmotesCell from "../../common/EmotesCell/EmotesCell";

import {
	RACHA_INFO_MD,
	MENSAJES_CHAT_MD,
	MENSAJES_MOD_MD,
	MENSAJES_NO_MOD_MD,
	TICKETS_INFO_MD,
	EMOTES_INFO_MD,
} from "./content";
import "./Inicio.css";

const ChevronIcons = {
	down: (
		<MdiChevronDown
			width={20}
			height={20}
			style={{ color: "var(--text)" }}
		/>
	),
	up: (
		<MdiChevronUp width={20} height={20} style={{ color: "var(--text)" }} />
	),
	doubleDown: (
		<MdiChevronDoubleDown
			width={20}
			height={20}
			style={{ color: "var(--text)" }}
		/>
	),
};

function getMensajesChevron(view, isMod) {
	if (isMod)
		return [ChevronIcons.down, ChevronIcons.doubleDown, ChevronIcons.up][
			view
		];
	return view === 0 ? ChevronIcons.down : ChevronIcons.up;
}

const userColumns = (valueKey, Icon) => [
	{
		key: "pfp",
		className: "user-avatar-cell",
		render: (row) => (
			<img src={row.pfp} alt={row.nombre} className="profile-pic" />
		),
	},
	{ key: "nombre" },
	{
		key: valueKey,
		icon: (
			<Icon
				style={{ verticalAlign: "baseline", color: "var(--text-2)" }}
				width="14"
				height="14"
			/>
		),
	},
];

const rachaColumns = [
	{
		key: "pfp",
		className: "user-avatar-cell",
		render: (row) => (
			<img src={row.pfp} alt={row.nombre} className="profile-pic" />
		),
	},
	{ key: "nombre" },
	{
		key: "racha",
		icon: (
			<SolarFireBold
				width={14}
				height={14}
				style={{ verticalAlign: "baseline" }}
			/>
		),
	},
];

function Inicio() {
	const { isMod } = useAuth();
	const [showLoading, setShowLoading] = useState(true);
	const [expandedAchievements, setExpandedAchievements] = useState([]);
	const [showRachaTable, setShowRachaTable] = useState(true);
	const [mensajesView, setMensajesView] = useState(0);
	const [showTicketsTable, setShowTicketsTable] = useState(true);
	const [showEmotesTable, setShowEmotesTable] = useState(true);

	const loadingStartRef = React.useRef(Date.now());
	const MIN_LOADING_MS = 600;

	const { searchInput, debouncedSearch, handleSearchChange } =
		useDebouncedSearch(["racha", "mensajes", "tickets", "emotes"]);

	const {
		rachasUsers,
		mensajesUsers,
		ticketsUsers,
		emotesUsers,
		achievementDetails,
		achievements,
		platinoUsuarios,
		totalUsuarios,
		rachasActivas,
		totalMensajes,
		totalTickets,
		totalEmotes,
		usuariosConLogros,
		anyLoading,
		anyRateLimitError,
		anyStatusError,
	} = useDashboardData(debouncedSearch);

	const { achievementsGridRef, maxUsersMap } =
		useAchievementLayout(achievements);
	const { emotesTableRef, emotesRowLines, maxEmotesPerRow, cycleEmoteLine } =
		useEmoteLayout(showEmotesTable, emotesUsers);

	const mensajesColumns = useMemo(
		() => userColumns("mensajes", MaterialSymbolsAndroidMessages),
		[],
	);
	const ticketsColumns = useMemo(() => userColumns("tickets", IonTicket), []);

	const cycleMensajesView = isMod
		? () => setMensajesView((v) => (v === 2 ? 0 : v + 1))
		: () => setMensajesView((v) => (v === 1 ? 0 : 1));

	useEffect(() => {
		if (!anyLoading) {
			const elapsed = Date.now() - loadingStartRef.current;
			const delay = Math.max(0, MIN_LOADING_MS - elapsed);
			const timer = setTimeout(() => setShowLoading(false), delay);
			return () => clearTimeout(timer);
		}
	}, [anyLoading]);

	return (
		<>
			<LoadingScreen
				visible={showLoading}
				error={anyRateLimitError || anyStatusError}
			/>
			<div className="main-container">
				<div className="top-section">
					<h2>Tablas de Datos</h2>
					<div className="top-section-h2-down">
						<span>
							<b>{totalUsuarios}</b> usuario
							{totalUsuarios === 1 ? "" : "s"}
						</span>
					</div>
				</div>

				<div className="stats-grid inset-section">
					<StatSection
						title="Rachas"
						icon={
							showRachaTable ? ChevronIcons.down : ChevronIcons.up
						}
						expanded={showRachaTable}
						onToggle={() => setShowRachaTable((prev) => !prev)}
						subtitle={`${rachasActivas} activas`}
						searchBar={
							showRachaTable && (
								<SearchBar
									placeholder="Buscar usuario..."
									value={searchInput.racha}
									onChange={handleSearchChange("racha")}
								/>
							)
						}
					>
						<div className="table-container">
							{showRachaTable ? (
								<StatTable
									type="racha"
									rowKey="id"
									rows={rachasUsers}
									columns={rachaColumns}
								/>
							) : (
								<MarkdownBlock md={RACHA_INFO_MD} />
							)}
						</div>
					</StatSection>

					<StatSection
						title="Mensajes"
						icon={getMensajesChevron(mensajesView, isMod)}
						expanded={mensajesView === 0}
						onToggle={cycleMensajesView}
						subtitle={`${totalMensajes} mensajes`}
						searchBar={
							mensajesView === 0 && (
								<SearchBar
									placeholder="Buscar usuario..."
									value={searchInput.mensajes}
									onChange={handleSearchChange("mensajes")}
								/>
							)
						}
					>
						{mensajesView === 0 && (
							<div className="table-container">
								<StatTable
									type="mensajes"
									rowKey="id"
									rows={mensajesUsers}
									columns={mensajesColumns}
								/>
							</div>
						)}
						{mensajesView === 1 && (
							<MarkdownBlock>
								<ReactMarkdown rehypePlugins={[rehypeRaw]}>
									{MENSAJES_CHAT_MD}
								</ReactMarkdown>
								<ReactMarkdown rehypePlugins={[rehypeRaw]}>
									{isMod ? "" : MENSAJES_NO_MOD_MD}
								</ReactMarkdown>
							</MarkdownBlock>
						)}
						{isMod && mensajesView === 2 && (
							<MarkdownBlock md={MENSAJES_MOD_MD} />
						)}
					</StatSection>

					<StatSection
						title="Tickets"
						icon={
							showTicketsTable
								? ChevronIcons.down
								: ChevronIcons.up
						}
						expanded={showTicketsTable}
						onToggle={() => setShowTicketsTable((prev) => !prev)}
						subtitle={`${totalTickets} tickets`}
						searchBar={
							showTicketsTable && (
								<SearchBar
									placeholder="Buscar usuario..."
									value={searchInput.tickets}
									onChange={handleSearchChange("tickets")}
								/>
							)
						}
					>
						<div className="table-container">
							{showTicketsTable ? (
								<StatTable
									type="tickets"
									rowKey="id"
									rows={ticketsUsers}
									columns={ticketsColumns}
								/>
							) : (
								<MarkdownBlock md={TICKETS_INFO_MD} />
							)}
						</div>
					</StatSection>

					<StatSection
						title="Emotes"
						icon={
							showEmotesTable
								? ChevronIcons.down
								: ChevronIcons.up
						}
						expanded={showEmotesTable}
						onToggle={() => setShowEmotesTable((prev) => !prev)}
						subtitle={`${totalEmotes} emotes`}
						searchBar={
							showEmotesTable && (
								<SearchBar
									placeholder="Buscar usuario..."
									value={searchInput.emotes}
									onChange={handleSearchChange("emotes")}
								/>
							)
						}
					>
						<div className="table-container" ref={emotesTableRef}>
							{showEmotesTable ? (
								<StatTable
									type="emotes"
									rowKey="id"
									rows={emotesUsers.map((user, index) => {
										const maxPerLine =
											maxEmotesPerRow[index] || 999;
										const allEmotes = Array.isArray(
											user.emotes,
										)
											? user.emotes
											: [];
										const currentLineIndex =
											emotesRowLines[index] || 0;
										const totalLinesNeeded = Math.ceil(
											allEmotes.length / maxPerLine,
										);
										const hasMany = totalLinesNeeded > 1;
										const startIndex =
											currentLineIndex * maxPerLine;
										const endIndex = Math.min(
											startIndex + maxPerLine,
											allEmotes.length,
										);

										return {
											...user,
											allEmotes,
											startIndex,
											endIndex,
											maxEmotesPerLine: maxPerLine,
											currentLineIndex,
											totalLinesNeeded,
											hasMany,
											rowIndex: index,
										};
									})}
									columns={[
										{
											key: "pfp",
											className: "user-avatar-cell",
											render: (row) => (
												<img
													src={row.pfp}
													alt={row.nombre}
													className="profile-pic"
													title={row.nombre}
												/>
											),
										},
										{
											key: "emotes",
											className: "emotes-cell",
											render: (row) => (
												<EmotesCell
													row={row}
													cycleEmoteLine={
														cycleEmoteLine
													}
												/>
											),
										},
									]}
								/>
							) : (
								<MarkdownBlock md={EMOTES_INFO_MD} />
							)}
						</div>
					</StatSection>
				</div>

				<div className="top-section" style={{ marginTop: "20px" }}>
					<div style={{ flex: 1 }}>
						<h2>Logros del Directo</h2>
						<div className="top-section-h2-down">
							<span>
								<b>{usuariosConLogros}</b> usuario
								{usuariosConLogros === 1 ? "" : "s"}
							</span>
							{platinoUsuarios.length > 0 && (
								<span
									style={{
										display: "flex",
										alignItems: "center",
										gap: "6px",
									}}
								>
									{platinoUsuarios.map((user, idx) => (
										<div
											key={user.id || user.nombre || idx}
											className="platino-avatar-wrapper"
										>
											<img
												src={user.pfp}
												alt={user.nombre}
												className="achievement-user-avatar"
												title={user.nombre}
											/>
											<TablerDiamondFilled className="platino-diamond-badge" />
										</div>
									))}
								</span>
							)}
						</div>
					</div>
				</div>
				<div
					className="achievements-grid inset-section"
					ref={achievementsGridRef}
				>
					{Object.entries(achievementDetails).map(
						([key, details]) => {
							const users = achievements[key] || [];
							const maxUsers = maxUsersMap[key] || 7;
							const expanded = expandedAchievements.includes(key);
							return (
								<AchievementSection
									key={key}
									details={{ ...details, key }}
									users={users}
									expanded={expanded}
									maxUsers={maxUsers}
									onToggle={() =>
										setExpandedAchievements((prev) =>
											expanded
												? prev.filter((k) => k !== key)
												: [...prev, key],
										)
									}
								/>
							);
						},
					)}
				</div>
			</div>
		</>
	);
}

function MarkdownBlock({ md, children }) {
	return (
		<div className="table-markdown-wrapper">
			<div className="table-markdown">
				{md ? (
					<ReactMarkdown rehypePlugins={[rehypeRaw]}>
						{md}
					</ReactMarkdown>
				) : (
					children
				)}
			</div>
		</div>
	);
}

export default Inicio;
