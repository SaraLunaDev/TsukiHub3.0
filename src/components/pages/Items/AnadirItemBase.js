import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { useItemSearch } from "../../../hooks/useItemSearch";
import { parseDuration } from "../../../utils/itemHelpers";
import SearchBar from "../../common/SearchBar/SearchBar";
import ItemImagenSmall from "../../common/ItemImagenSmall/ItemImagenSmall";
import "../EditarItem/EditarItem.css";
import "../Recomendar/Recomendar.css";

function AnadirItemBase({ config }) {
	const navigate = useNavigate();
	const { isAdmin, user, token, authLoading } = useAuth();

	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [successMsg, setSuccessMsg] = useState("");

	const {
		search,
		setSearch,
		searchResults,
		setSearchResults,
		searchLoading,
		searchError,
	} = useItemSearch(config);

	const [selectedResult, setSelectedResult] = useState(null);

	const [itemData, setItemData] = useState({
		tipo: config.tipo,
		estado: "Planeo",
	});

	useEffect(() => {
		if (authLoading) return;
		if (user && !isAdmin) {
			navigate("/");
		}
	}, [user, isAdmin, authLoading, navigate]);

	const handleSelectResult = (result) => {
		setSelectedResult(result);
		setSearch("");
		setSearchResults([]);

		setItemData({
			tipo: config.tipo,
			id: result.id || "",
			nombre: result.nombre || result.title || result.name || "",
			estado: "Planeo",
			plataforma: config.getTipoValueOnSelect(result),
			fecha: "",
			duracion: result.duracion || "",
			duracion_horas: result.duracion
				? String(Math.floor(parseDuration(result.duracion) / 60))
				: "",
			duracion_minutos: result.duracion
				? String(parseDuration(result.duracion) % 60)
				: "",
			nota: "",
			youtube_url: "",
			caratula: result.caratula || "",
			imagen: result.imagen || "",
			trailer: result.trailer || "",
			generos: Array.isArray(result.generos)
				? result.generos.join(", ")
				: result.generos || "",
			resumen: result.resumen || "",
			fecha_salida: String(
				result.fecha || result.raw?.fecha_salida || "",
			),
			nota_global: result.nota_global || "",
			creador: result.creador || "",
			comentario: "",
		});
	};

	const handleInputChange = (field, value) => {
		setItemData((prev) => ({ ...prev, [field]: value }));
	};

	const setTodayFecha = () => {
		const now = new Date();
		const dd = String(now.getDate()).padStart(2, "0");
		const mm = String(now.getMonth() + 1).padStart(2, "0");
		const yyyy = now.getFullYear();
		handleInputChange("fecha", `${dd}/${mm}/${yyyy}`);
	};

	const handleSave = async (e) => {
		e.preventDefault();
		setSaving(true);
		setError("");
		setSuccessMsg("");

		try {
			const payload = {
				tipo: config.tipo,
				external_id: itemData.id ? parseInt(itemData.id) : null,
				nombre: itemData.nombre || "",
				estado: itemData.estado || "Planeo",
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

			const response = await fetch("/api/items/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(token ? { "X-User-Token": token } : {}),
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new Error(
					`Error ${response.status}: ${response.statusText}`,
				);
			}

			const created = await response.json();

			if (itemData.comentario) {
				try {
					await fetch("/api/comentarios/", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							...(token ? { "X-User-Token": token } : {}),
						},
						body: JSON.stringify({
							item_id: created.id,
							item_nombre: created.nombre,
							comentario: itemData.comentario,
						}),
					});
				} catch {}
			}

			setSuccessMsg("¡Item añadido correctamente!");
			setSelectedResult(null);
			setItemData({
				tipo: config.tipo,
				estado: "Planeo",
			});
		} catch (err) {
			setError("Error al añadir: " + err.message);
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
			<div className="top-section editar-header">
				<div className="header-title-ellipsis">
					<span className="header-title-text">
						{config.labels.title}
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
			{successMsg && (
				<div className="anadir-success-message">{successMsg}</div>
			)}

			<div className="inset-section recomendar-section">
				<SearchBar
					placeholder={config.labels.searchPlaceholder}
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
									className={`autocomplete-item${idx !== searchResults.length - 1 ? " autocomplete-item-border" : ""}${selectedResult && selectedResult.id === result.id ? " autocomplete-item-selected" : ""}`}
									onClick={() => handleSelectResult(result)}
								>
									<ItemImagenSmall
										Imagen={
											result.imagen || result.caratula
										}
										Nombre={
											result.nombre ||
											result.title ||
											result.name
										}
										Resumen={
											result.resumen || result.overview
										}
										Trailer={result.trailer}
										Generos={
											Array.isArray(result.generos)
												? result.generos.join(", ")
												: result.generos
										}
										Fecha_Salida={
											result.fecha || result.fecha_salida
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
											result.caratula || result.Caratula
										}
										Duracion={
											result.duracion || result.Duracion
										}
									/>
								</div>
							))}
						</div>
					)}
			</div>

			{selectedResult && (
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
											<option value="">
												Seleccionar...
											</option>
											<option value="Ahora">Ahora</option>
											<option value="Planeo">
												Planeo
											</option>
											<option value="Pasado">
												Pasado
											</option>
											<option value="Dropeado">
												Dropeado
											</option>
											<option value="Recomendacion">
												Recomendación
											</option>
											<option value="Pausado">
												Pausado
											</option>
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
													itemData.duracion_horas ??
													""
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
													itemData.duracion_minutos ??
													""
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
												value={
													itemData.nota_global || 0
												}
												onChange={(e) =>
													handleInputChange(
														"nota_global",
														e.target.value,
													)
												}
											/>
											<span className="slider-value">
												{Number(
													itemData.nota_global || 0,
												)
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
								</div>
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
													e.target.style.display =
														"none";
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
													e.target.style.display =
														"none";
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
							</div>
						</div>
						<div className="form-actions">
							<button
								type="button"
								onClick={() => {
									setSelectedResult(null);
									setItemData({
										tipo: config.tipo,
										estado: "Planeo",
									});
								}}
								disabled={saving}
								className="btn-cancel"
							>
								Limpiar
							</button>
							<button
								type="submit"
								disabled={saving}
								className="btn-save"
							>
								{saving ? "Añadiendo..." : "Añadir"}
							</button>
						</div>
					</form>
				</div>
			)}
		</div>
	);
}

export default AnadirItemBase;
