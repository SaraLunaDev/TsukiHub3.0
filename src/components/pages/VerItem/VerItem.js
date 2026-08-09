import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { MaterialSymbolsLightKidStar } from "../../icons/MaterialSymbolsLightKidStar";
import { MaterialSymbolsClose } from "../../icons/MaterialSymbolsClose";
import { useAuth } from "../../../hooks/useAuth";
import { Fa7SolidThumbsUp } from "../../icons/Fa7SolidThumbsUp";
import "./VerItem.css";

const TABS = [
	{ id: "descripcion", label: "Descripción" },
	{ id: "enlaces", label: "Enlaces" },
	{ id: "comentarios", label: "Comentarios" },
];
export default function VerItem({ id, onClose, isJuegos: propIsJuegos }) {
	const { user, token } = useAuth();
	const fetchedRef = useRef(null);

	const [loading, setLoading] = useState(true);
	const [item, setItem] = useState(null);
	const [usuario, setUsuario] = useState(null);
	const [votes, setVotes] = useState(0);
	const [hasVoted, setHasVoted] = useState(false);
	const [voting, setVoting] = useState(false);
	const [activeTab, setActiveTab] = useState("descripcion");
	const [comentarios, setComentarios] = useState([]);
	const [nuevoComentario, setNuevoComentario] = useState("");
	const [enviandoComentario, setEnviandoComentario] = useState(false);

	const handleSubmitComentario = async (e) => {
		e.preventDefault();
		if (!nuevoComentario.trim() || !user || enviandoComentario) return;
		setEnviandoComentario(true);
		try {
			const res = await fetch("/api/comentarios/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(token ? { "X-User-Token": token } : {}),
				},
				body: JSON.stringify({
					item_id: parseInt(id),
					item_nombre: item?.nombre || "",
					comentario: nuevoComentario.trim(),
				}),
			});
			if (res.ok) {
				const nuevo = await res.json();
				nuevo.usuario_nombre = user.displayName;
				nuevo.usuario_imagen_perfil = user.profileImage;
				setComentarios((prev) => [nuevo, ...prev]);
				setNuevoComentario("");
			}
		} catch (err) {
			console.error(err);
		} finally {
			setEnviandoComentario(false);
		}
	};

	const isJuegos = propIsJuegos ?? false;

	const handleKeyDown = useCallback(
		(e) => {
			if (e.key === "Escape" && onClose) onClose();
		},
		[onClose],
	);

	useEffect(() => {
		if (!onClose) return;
		document.addEventListener("keydown", handleKeyDown);
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "";
		};
	}, [onClose, handleKeyDown]);

	useEffect(() => {
		if (!id || fetchedRef.current === id) return;
		fetchedRef.current = id;
		const loadItem = async () => {
			setLoading(true);
			try {
				const userId = user?.id;
				const url = userId
					? `/api/items/${id}/detail?current_user_id=${userId}`
					: `/api/items/${id}/detail`;
				const res = await fetch(url);
				if (!res.ok) throw new Error("Error al cargar el item");
				const data = await res.json();

				setItem(data);
				setUsuario(
					data.usuario_nombre
						? {
								nombre: data.usuario_nombre,
								imagen_perfil: data.usuario_imagen_perfil,
							}
						: null,
				);
				setVotes(data.votos_count || 0);
				setHasVoted(data.has_voted || false);
				setComentarios(data.comentarios || []);
			} catch (err) {
				fetchedRef.current = null;
			} finally {
				setLoading(false);
			}
		};
		loadItem();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const handleVote = async () => {
		if (!user || voting) return;
		setVoting(true);
		try {
			const resp = await fetch("/api/votos/toggle", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(token ? { "X-User-Token": token } : {}),
				},
				body: JSON.stringify({
					item_id: parseInt(id),
					item_nombre: item?.nombre || "",
				}),
			});
			if (resp.ok) {
				const data = await resp.json();
				const voted = data.activo;
				setHasVoted(voted);
				setVotes((v) => (voted ? v + 1 : Math.max(0, v - 1)));
			}
		} catch (err) {
			console.error(err);
		} finally {
			setVoting(false);
		}
	};

	const getYoutubeId = (url) => {
		if (!url) return null;
		let normalized = url;
		if (!/^https?:\/\//i.test(normalized)) {
			normalized = "https://" + normalized;
		}
		try {
			const u = new URL(normalized);
			if (u.hostname.includes("youtube.com")) {
				const vid = u.searchParams.get("v");
				if (vid) return vid;
				const list = u.searchParams.get("list");
				if (list && u.pathname.includes("/playlist")) {
					return `videoseries?list=${list}`;
				}
				if (u.pathname.includes("/embed/")) {
					return u.pathname.split("/embed/")[1]?.split("?")[0];
				}
				if (u.pathname.includes("/live/")) {
					return u.pathname.split("/live/")[1]?.split("?")[0];
				}
			}
			if (u.hostname === "youtu.be") {
				return u.pathname.slice(1).split("?")[0];
			}
		} catch {}
		return null;
	};

	const formatDate = (dateStr) => {
		if (!dateStr) return null;
		const [d, m, y] = dateStr.split("/");
		if (d && m && y) {
			return `${String(parseInt(d)).padStart(2, "0")}/${String(parseInt(m)).padStart(2, "0")}/${y}`;
		}
		return dateStr;
	};

	const formatDuracion = (mins) => {
		if (!mins || mins <= 0) return "";
		const h = Math.floor(mins / 60);
		const m = Math.round(mins % 60);
		if (h > 0 && m > 0) return `${h}h ${m}m`;
		if (h > 0) return `${h}h`;
		return `${m}m`;
	};

	const formatFecha = (isoStr) => {
		if (!isoStr) return "";
		try {
			const date = new Date(isoStr);
			const day = String(date.getDate()).padStart(2, "0");
			const month = String(date.getMonth() + 1).padStart(2, "0");
			return `${day}/${month}/${date.getFullYear()}`;
		} catch {
			return isoStr;
		}
	};

	let nombrePrincipal = item?.nombre
		? item.nombre.replace(/\s*\[[^\]]*\]$/, "")
		: "";
	let nombreSecundario = null;
	if (item?.nombre) {
		const match = item.nombre.match(/\[([^\]]+)\]/);
		if (match) nombreSecundario = match[1];
	}
	const plataformas = item?.plataforma
		? item.plataforma
				.split(",")
				.map((p) => p.trim())
				.filter(Boolean)
		: [];

	const allGeneros = item?.generos
		? item.generos
				.split(",")
				.map((g) => g.trim())
				.filter(Boolean)
		: [];

	const bgImagen = item?.imagen || item?.caratula;

	const handleOverlayClick = (e) => {
		if (e.target === e.currentTarget && onClose) onClose();
	};

	const innerContent = loading ? (
		<>
			<div className="top-section veritem-header">
				<button
					className="veritem-modal-close"
					onClick={onClose}
					aria-label="Cerrar"
				>
					<MaterialSymbolsClose />
				</button>
			</div>
		</>
	) : !item ? (
		<div
			className="main-container"
			style={{ textAlign: "center", padding: 48, color: "var(--text-2)" }}
		>
			Item no encontrado
		</div>
	) : (
		<>
			<div className="top-section veritem-header">
				<button
					className="veritem-modal-close"
					onClick={onClose}
					aria-label="Cerrar"
				>
					<MaterialSymbolsClose />
				</button>
			</div>

			<div className="inset-section">
				<div className="veritem-banner">
					{bgImagen && (
						<img
							src={bgImagen}
							alt=""
							className="veritem-banner-bg"
						/>
					)}
					<div className="veritem-banner-overlay" />
					<div className="veritem-banner-content">
						<div className="veritem-banner-main">
							<header className="veritem-banner-header">
								{nombrePrincipal && (
									<h2 className="veritem-banner-title">
										{nombrePrincipal}
									</h2>
								)}
								{nombreSecundario && (
									<div className="veritem-banner-subtitle">
										{nombreSecundario}
									</div>
								)}
							</header>

							{(allGeneros.length > 0 ||
								item.nota != null ||
								item.nota_global != null) && (
								<div className="veritem-banner-footer">
									{allGeneros.length > 0 && (
										<div className="veritem-banner-genres">
											{allGeneros.map((g, i) => (
												<span
													key={i}
													className="veritem-banner-genre"
												>
													{g}
												</span>
											))}
										</div>
									)}
									{(item.nota != null ||
										item.nota_global != null) && (
										<div className="veritem-banner-notas">
											{item.nota != null && (
												<div className="veritem-banner-nota">
													<MaterialSymbolsLightKidStar className="veritem-banner-star" />
													<span className="veritem-banner-nota-val">
														{Number(
															item.nota,
														).toFixed(1)}
													</span>
													<span className="veritem-banner-nota-src">
														Personal
													</span>
												</div>
											)}
											{item.nota_global != null && (
												<div className="veritem-banner-nota">
													<MaterialSymbolsLightKidStar className="veritem-banner-star" />
													<span className="veritem-banner-nota-val">
														{Number(
															item.nota_global,
														).toFixed(1)}
													</span>
													<span className="veritem-banner-nota-src">
														{isJuegos
															? "IGDB"
															: "IMDB"}
													</span>
												</div>
											)}
										</div>
									)}
								</div>
							)}
						</div>

						{item.caratula && (
							<div className="veritem-banner-cover-wrapper">
								<img
									src={item.caratula}
									alt="Carátula"
									className="veritem-banner-cover"
								/>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="inset-section">
				<div className="veritem-content-grid">
					{" "}
					<div className="veritem-left">
						<div className="veritem-tabs">
							{TABS.map((tab) => (
								<button
									key={tab.id}
									className={`veritem-tab ${activeTab === tab.id ? "active" : ""}`}
									onClick={() => setActiveTab(tab.id)}
								>
									<span>{tab.label}</span>
								</button>
							))}
						</div>
						<div className="veritem-tab-content">
							{activeTab === "descripcion" && (
								<div className="veritem-tab-panel">
									{item.resumen ? (
										<p>{item.resumen}</p>
									) : (
										<p className="veritem-empty">
											No hay descripción disponible
										</p>
									)}
								</div>
							)}

							{activeTab === "enlaces" && (
								<div className="veritem-tab-panel">
									<div className="veritem-enlaces">
										{(() => {
											const trailerId = getYoutubeId(
												item.trailer,
											);
											const ytId = getYoutubeId(
												item.youtube_url,
											);
											const ids = [];
											if (trailerId)
												ids.push({
													id: trailerId,
													label: "Trailer",
												});
											if (ytId)
												ids.push({
													id: ytId,
													label: "VOD",
												});
											if (ids.length === 0) {
												return (
													<p className="veritem-empty">
														No hay enlaces
														disponibles
													</p>
												);
											}
											return ids.map((v) => (
												<div
													key={v.label}
													className="veritem-video-section"
												>
													<div className="veritem-video-label">
														{v.label}
													</div>
													<div className="veritem-video-embed">
														<iframe
															src={`https://www.youtube.com/embed/${v.id}`}
															title={v.label}
															allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
															allowFullScreen
														/>
													</div>
												</div>
											));
										})()}
									</div>
								</div>
							)}

							{activeTab === "comentarios" && (
								<div className="veritem-tab-panel">
									<div className="veritem-comentarios">
										{comentarios.length > 0 && (
											<div className="veritem-comentarios-list">
												{comentarios.map((c) => (
													<div
														key={c.id}
														className="veritem-comentario-item"
													>
														{c.usuario_imagen_perfil && (
															<img
																src={
																	c.usuario_imagen_perfil
																}
																alt=""
																className="veritem-comentario-avatar"
															/>
														)}
														<div className="veritem-comentario-body">
															<div className="veritem-comentario-header">
																<span className="veritem-comentario-autor">
																	{c.usuario_nombre ||
																		"Usuario"}
																</span>
																<span className="veritem-comentario-fecha">
																	{c.creado_en
																		? formatFecha(
																				c.creado_en,
																			)
																		: ""}
																</span>
															</div>
															<p className="veritem-comentario-texto">
																{c.comentario}
															</p>
														</div>
													</div>
												))}
											</div>
										)}

										{user ? (
											<form
												className="veritem-comentario-form"
												onSubmit={
													handleSubmitComentario
												}
											>
												<input
													className="veritem-comentario-input"
													type="text"
													placeholder="Escribe un comentario..."
													value={nuevoComentario}
													onChange={(e) =>
														setNuevoComentario(
															e.target.value,
														)
													}
													disabled={
														enviandoComentario
													}
												/>
												<button
													className="veritem-comentario-btn"
													type="submit"
													disabled={
														!nuevoComentario.trim() ||
														enviandoComentario
													}
												>
													{enviandoComentario
														? "Enviando..."
														: "Enviar"}
												</button>
											</form>
										) : (
											<p className="veritem-empty">
												Inicia sesión para dejar un
												comentario
											</p>
										)}
									</div>
								</div>
							)}
						</div>
					</div>
					<aside className="veritem-sidebar">
						<div className="veritem-sidebar-card">
							<dl className="veritem-info-list">
								{usuario && (
									<>
										<dt>Recomendado por</dt>
										<dd>
											<div className="veritem-info-user">
												{usuario.imagen_perfil && (
													<img
														src={
															usuario.imagen_perfil
														}
														alt=""
														className="veritem-user-avatar-sm"
													/>
												)}
												<span>{usuario.nombre}</span>
											</div>
										</dd>
									</>
								)}
								{item.fecha && (
									<>
										<dt>{isJuegos ? "Jugado" : "Visto"}</dt>
										<dd>{item.fecha}</dd>
									</>
								)}
								{item.estado === "Recomendacion" && (
									<>
										<dt>Votos</dt>
										<dd className="veritem-vote-row">
											<span>{votes}</span>
											{user && (
												<button
													className={`veritem-vote-btn ${hasVoted ? "voted" : ""}`}
													onClick={handleVote}
													disabled={voting}
												>
													<Fa7SolidThumbsUp
														style={{ fontSize: 12 }}
													/>
													<span>
														{hasVoted
															? "Votado"
															: "Votar"}
													</span>
												</button>
											)}
										</dd>
									</>
								)}
								<>
									<dt>Estado</dt>
									<dd>
										{item.estado === "Recomendacion"
											? "Recomendado"
											: item.estado}
									</dd>
								</>
								{item.fecha_salida && (
									<>
										<dt>Lanzamiento</dt>
										<dd>{formatDate(item.fecha_salida)}</dd>
									</>
								)}
								{item.duracion != null && item.duracion > 0 && (
									<>
										<dt>Duración</dt>
										<dd>{formatDuracion(item.duracion)}</dd>
									</>
								)}
								{item.creador && (
									<>
										<dt>
											{isJuegos
												? "Desarrollador"
												: "Creador"}
										</dt>
										<dd>{item.creador}</dd>
									</>
								)}{" "}
								{plataformas.length > 0 && (
									<>
										<dt>
											{isJuegos ? "Plataformas" : "Tipo"}
										</dt>
										<dd>{plataformas.join(", ")}</dd>
									</>
								)}
							</dl>
						</div>
					</aside>
				</div>
			</div>
		</>
	);

	const content = (
		<div className="veritem-modal-overlay" onClick={handleOverlayClick}>
			<div className="veritem-modal-container">{innerContent}</div>
		</div>
	);

	if (onClose) {
		return createPortal(content, document.body);
	}

	return content;
}
