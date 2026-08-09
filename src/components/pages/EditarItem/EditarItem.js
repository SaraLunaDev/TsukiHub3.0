import React, { useState, useEffect } from "react";
import LoadingScreen from "../../common/LoadingScreen/LoadingScreen";
import { RATE_LIMIT_MSG, API_STATUS_ERROR_MSG } from "../../../constants";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import "./EditarItem.css";

export default function EditarItem() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { isAdmin, user, token, authLoading } = useAuth();
	const [loading, setLoading] = useState(true);
	const [rateLimitError, setRateLimitError] = useState(null);
	const [statusError, setStatusError] = useState(null);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [itemData, setItemData] = useState({});

	const loadingStartRef = React.useRef(Date.now());
	const mountedRef = React.useRef(true);
	const MIN_LOADING_MS = 600;

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	useEffect(() => {
		if (authLoading) return;
		if (user && !isAdmin) {
			navigate("/");
			return;
		}
	}, [user, isAdmin, authLoading, navigate]);

	useEffect(() => {
		if (!id || !user || !isAdmin || authLoading) return;

		const loadItemData = async () => {
			try {
				setLoading(true);
				setRateLimitError(null);
				setStatusError(null);

				const response = await fetch(`/api/items/${id}`);
				if (!response.ok) {
					if (response.status === 429) {
						throw new Error("RATE_LIMIT");
					}
					throw new Error(
						`Error ${response.status}: ${response.statusText}`,
					);
				}

				const item = await response.json();

				let comentario = "";
				try {
					const comentariosRes = await fetch(
						`/api/comentarios/item/${id}`,
					);
					if (comentariosRes.ok) {
						const comentarios = await comentariosRes.json();
						const match = comentarios.find(
							(c) =>
								String(c.usuario_id) ===
								String(item.usuario_id),
						);
						if (match) comentario = match.comentario || "";
					}
				} catch {}

				const totalMin = parseInt(item.duracion) || 0;
				item.duracion_horas = Math.floor(totalMin / 60) || "";
				item.duracion_minutos = totalMin % 60 || "";

				setItemData({ ...item, comentario });
			} catch (err) {
				if (err.message === "RATE_LIMIT") {
					setRateLimitError(RATE_LIMIT_MSG);
				} else {
					console.error("Error loading item:", err);
					setError(
						"Error al cargar los datos del item: " + err.message,
					);
					setStatusError(API_STATUS_ERROR_MSG);
				}
			} finally {
				const elapsed = Date.now() - loadingStartRef.current;
				const delay = Math.max(0, MIN_LOADING_MS - elapsed);
				setTimeout(() => {
					if (mountedRef.current) setLoading(false);
				}, delay);
			}
		};

		loadItemData();
	}, [id, user, isAdmin, authLoading]);

	const handleInputChange = (field, value) => {
		setItemData((prev) => ({ ...prev, [field]: value }));
	};

	const setTodayFecha = () => {
		const now = new Date();
		const dd = String(now.getDate()).padStart(2, "0");
		const mm = String(now.getMonth() + 1).padStart(2, "0");
		const yyyy = now.getFullYear();
		const formatted = `${dd}/${mm}/${yyyy}`;
		handleInputChange("fecha", formatted);
	};

	const handleSave = async (e) => {
		e.preventDefault();
		setSaving(true);
		setError("");

		try {
			const updatePayload = {
				nombre: itemData.nombre,
				estado: itemData.estado,
				plataforma: itemData.plataforma || null,
				fecha: itemData.fecha || null,
				duracion:
					itemData.duracion_horas || itemData.duracion_minutos
						? parseInt(itemData.duracion_horas || 0) * 60 +
							parseInt(itemData.duracion_minutos || 0)
						: null,
				nota:
					itemData.nota != null && itemData.nota !== ""
						? parseFloat(itemData.nota)
						: null,
				youtube_url: itemData.youtube_url || null,
				caratula: itemData.caratula || null,
				imagen: itemData.imagen || null,
				trailer: itemData.trailer || null,
				generos: itemData.generos || null,
				resumen: itemData.resumen || null,
				fecha_salida: itemData.fecha_salida || null,
				nota_global:
					itemData.nota_global != null && itemData.nota_global !== ""
						? parseFloat(itemData.nota_global)
						: null,
				creador: itemData.creador || null,
			};

			const response = await fetch(`/api/items/${itemData.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					...(token ? { "X-User-Token": token } : {}),
				},
				body: JSON.stringify(updatePayload),
			});

			if (!response.ok) {
				throw new Error(
					`Error ${response.status}: ${response.statusText}`,
				);
			}

			if (itemData.comentario !== undefined) {
				try {
					const comentariosRes = await fetch(
						`/api/comentarios/item/${itemData.id}`,
					);
					if (comentariosRes.ok) {
						const comentarios = await comentariosRes.json();
						const userId = itemData.usuario_id;
						const match = comentarios.find(
							(c) => String(c.usuario_id) === String(userId),
						);

						if (match) {
							if (itemData.comentario) {
								await fetch(`/api/comentarios/${match.id}`, {
									method: "PUT",
									headers: {
										"Content-Type": "application/json",
										...(token
											? { "X-User-Token": token }
											: {}),
									},
									body: JSON.stringify({
										comentario: itemData.comentario,
									}),
								});
							}
						} else if (itemData.comentario) {
							await fetch("/api/comentarios/", {
								method: "POST",
								headers: {
									"Content-Type": "application/json",
									...(token ? { "X-User-Token": token } : {}),
								},
								body: JSON.stringify({
									item_id: parseInt(itemData.id),
									item_nombre: itemData.nombre,
									comentario: itemData.comentario,
								}),
							});
						}
					}
				} catch {}
			}

			navigate(-1);
		} catch (error) {
			console.error("Error saving item:", error);
			setError("Error al guardar: " + error.message);
		} finally {
			setSaving(false);
		}
	};

	if (authLoading) return <div className="main-container">Cargando...</div>;
	if (!user || !isAdmin) {
		return <div>Acceso denegado</div>;
	}

	return (
		<div className="main-container">
			<LoadingScreen
				visible={loading}
				error={rateLimitError || statusError}
			/>
			<div className="top-section editar-header">
				<div className="header-title-ellipsis">
					<span className="header-title-text">
						{itemData.nombre || `Item #${id}`}
					</span>
					<button
						type="button"
						onClick={() => navigate(-1)}
						className="btn-back"
					>
						← Volver
					</button>
				</div>
			</div>

			{error && <div className="error-message">Error: {error}</div>}

			<div className="inset-section">
				<form onSubmit={handleSave} className="edit-form">
					<div className="edit-layout">
						<div className="form-grid">
							<div className="form-fields-grid">
								<div className="form-group">
									<label>Nombre</label>
									<input
										type="text"
										value={itemData.nombre || ""}
										onChange={(e) =>
											handleInputChange(
												"nombre",
												e.target.value,
											)
										}
									/>
								</div>
								<div className="form-group">
									<label>Estado</label>
									<select
										value={itemData.estado || ""}
										onChange={(e) =>
											handleInputChange(
												"estado",
												e.target.value,
											)
										}
									>
										<option value="">Seleccionar...</option>
										<option value="Ahora">Ahora</option>
										<option value="Planeo">Planeo</option>
										<option value="Pasado">Pasado</option>
										<option value="Dropeado">
											Dropeado
										</option>
										<option value="Recomendacion">
											Recomendación
										</option>
										<option value="Pausado">Pausado</option>
									</select>
								</div>
								<div className="form-group">
									<label>Tipo</label>
									<input
										type="text"
										value={itemData.plataforma || ""}
										onChange={(e) =>
											handleInputChange(
												"plataforma",
												e.target.value,
											)
										}
									/>
								</div>
								<div className="form-group">
									<label>Nota</label>
									<div className="slider-container">
										<input
											type="range"
											min="0"
											max="10"
											step="0.01"
											value={itemData.nota || 0}
											onChange={(e) =>
												handleInputChange(
													"nota",
													e.target.value,
												)
											}
										/>
										<span className="slider-value">
											{Number(itemData.nota || 0)
												.toFixed(2)
												.replace(/\.?0+$/, "")}
										</span>
									</div>
								</div>
								<div className="form-group">
									<label>URL</label>
									<input
										type="url"
										value={itemData.youtube_url || ""}
										onChange={(e) =>
											handleInputChange(
												"youtube_url",
												e.target.value,
											)
										}
									/>
								</div>
								<div className="form-group">
									<label>Duración</label>
									<div className="duracion-inputs">
										<input
											type="number"
											min="0"
											placeholder="Horas"
											value={
												itemData.duracion_horas ?? ""
											}
											onChange={(e) =>
												handleInputChange(
													"duracion_horas",
													e.target.value,
												)
											}
										/>
										<span className="duracion-separator">
											h
										</span>
										<input
											type="number"
											min="0"
											max="59"
											placeholder="Min"
											value={
												itemData.duracion_minutos ?? ""
											}
											onChange={(e) =>
												handleInputChange(
													"duracion_minutos",
													e.target.value,
												)
											}
										/>
										<span className="duracion-separator">
											min
										</span>
									</div>
								</div>
								<div className="form-group fecha-group">
									<label>Fecha</label>
									<div className="fecha-input-wrapper">
										<input
											type="text"
											value={itemData.fecha || ""}
											onChange={(e) =>
												handleInputChange(
													"fecha",
													e.target.value,
												)
											}
										/>
										<button
											type="button"
											onClick={setTodayFecha}
										>
											Hoy
										</button>
									</div>
								</div>
								<div className="form-group">
									<label>Fecha Salida</label>
									<input
										type="text"
										value={itemData.fecha_salida || ""}
										onChange={(e) =>
											handleInputChange(
												"fecha_salida",
												e.target.value,
											)
										}
									/>
								</div>
								<div className="form-group">
									<label>Trailer</label>
									<input
										type="url"
										value={itemData.trailer || ""}
										onChange={(e) =>
											handleInputChange(
												"trailer",
												e.target.value,
											)
										}
									/>
								</div>
								<div className="form-group">
									<label>Nota Global</label>
									<div className="slider-container">
										<input
											type="range"
											min="0"
											max="10"
											step="0.001"
											value={itemData.nota_global || 0}
											onChange={(e) =>
												handleInputChange(
													"nota_global",
													e.target.value,
												)
											}
										/>
										<span className="slider-value">
											{Number(itemData.nota_global || 0)
												.toFixed(2)
												.replace(/\.?0+$/, "")}
										</span>
									</div>
								</div>
								<div className="form-group">
									<label>Creador</label>
									<input
										type="text"
										value={itemData.creador || ""}
										onChange={(e) =>
											handleInputChange(
												"creador",
												e.target.value,
											)
										}
									/>
								</div>
							</div>
							<div className="form-group form-group-full">
								<label>Géneros</label>
								<input
									type="text"
									value={itemData.generos || ""}
									onChange={(e) =>
										handleInputChange(
											"generos",
											e.target.value,
										)
									}
									placeholder="Separados por comas"
								/>
							</div>
							<div className="form-group form-group-full resumen-field">
								<label>Resumen</label>
								<textarea
									value={itemData.resumen || ""}
									onChange={(e) =>
										handleInputChange(
											"resumen",
											e.target.value,
										)
									}
								/>
							</div>
							<div className="form-group form-group-full comentario-field">
								<label>Comentario</label>
								<textarea
									value={itemData.comentario || ""}
									onChange={(e) =>
										handleInputChange(
											"comentario",
											e.target.value,
										)
									}
									rows={2}
								/>
							</div>{" "}
						</div>
						<div className="images-sidebar">
							<div className="form-group">
								<label>Carátula</label>
								{itemData.caratula && (
									<div className="image-preview">
										<img
											src={itemData.caratula}
											alt="Previsualización carátula"
											onError={(e) => {
												e.target.style.display = "none";
											}}
											onLoad={(e) => {
												e.target.style.display =
													"block";
											}}
										/>
									</div>
								)}
								<input
									type="url"
									value={itemData.caratula || ""}
									onChange={(e) =>
										handleInputChange(
											"caratula",
											e.target.value,
										)
									}
									placeholder="URL de la carátula"
								/>
							</div>

							<div className="form-group">
								<label>Imagen</label>
								{itemData.imagen && (
									<div className="image-preview">
										<img
											src={itemData.imagen}
											alt="Previsualización imagen"
											onError={(e) => {
												e.target.style.display = "none";
											}}
											onLoad={(e) => {
												e.target.style.display =
													"block";
											}}
										/>
									</div>
								)}
								<input
									type="url"
									value={itemData.imagen || ""}
									onChange={(e) =>
										handleInputChange(
											"imagen",
											e.target.value,
										)
									}
									placeholder="URL de la imagen"
								/>
							</div>
						</div>{" "}
					</div>

					<div className="form-actions">
						<button
							type="button"
							onClick={() => navigate(-1)}
							disabled={saving}
							className="btn-cancel"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={saving}
							className="btn-save"
						>
							{saving ? "Guardando..." : "Guardar"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
