import React, { useState, useEffect, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { MaterialSymbolsAndroidMessages } from "../../icons/MaterialSymbolsAndroidMessages";
import "./ItemCaratula.css";
import { MaterialSymbolsPlayArrowRounded } from "../../icons/MaterialSymbolsPlayArrowRounded";
import { IconamoonInformationCircleBold } from "../../icons/IconamoonInformationCircleBold";
import { MaterialSymbolsLightKidStar } from "../../icons/MaterialSymbolsLightKidStar";
import { MaterialSymbolsAlarm } from "../../icons/MaterialSymbolsAlarm";
import { MaterialSymbolsClose } from "../../icons/MaterialSymbolsClose";
import { MaterialSymbolsEdit } from "../../icons/MaterialSymbolsEdit";
import { STORAGE_KEYS } from "../../../constants/config";
import useLocalStorage from "../../../hooks/useLocalStorage";
import { useAuth } from "../../../hooks/useAuth";
import { Fa7SolidThumbsUp } from "../../icons/Fa7SolidThumbsUp";

const VerItem = React.lazy(() => import("../../pages/VerItem/VerItem"));

export default function ItemCaratula({
	Caratula,
	Nombre,
	Trailer,
	Fecha,
	Fecha_Salida,
	Duracion,
	Nota,
	Nota_Global,
	URL,
	Estado,
	Usuario,
	userSheet,
	Comentario,
	ID,
	Id,
	id,
	onRecommendationDeleted,
	onVote,
	voteCount = 0,
	hasVotedInitial = false,
}) {
	const itemId = ID || Id || id;

	const navigate = useNavigate();
	const [user] = useLocalStorage(STORAGE_KEYS.TWITCH_USER, null);
	const { isAdmin, token } = useAuth();
	const [hover, setHover] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [votes, setVotes] = useState(voteCount || 0);
	const [voting, setVoting] = useState(false);
	const [hasVoted, setHasVoted] = useState(hasVotedInitial || false);
	const [showVerItem, setShowVerItem] = useState(false);

	const isJuegos = window.location.pathname.includes("/juegos");

	const isOwnRecommendation =
		user &&
		Estado === "Recomendacion" &&
		String(Usuario).trim() === String(user.id).trim();

	const canDelete = user && (isAdmin || isOwnRecommendation);

	useEffect(() => {
		setVotes(voteCount || 0);
	}, [voteCount]);
	useEffect(() => {
		setHasVoted(hasVotedInitial || false);
	}, [hasVotedInitial]);

	const handleVote = async (e) => {
		if (e?.stopPropagation) e.stopPropagation();
		if (!user || voting || isOwnRecommendation) return;
		setVoting(true);
		try {
			const resp = await fetch("/api/votos/toggle", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(token ? { "X-User-Token": token } : {}),
				},
				body: JSON.stringify({
					item_id: parseInt(itemId),
					item_nombre: Nombre || "",
				}),
			});
			if (resp.ok) {
				const data = await resp.json();
				const voted = data.activo;
				setHasVoted(voted);
				const newCount = voted ? votes + 1 : Math.max(0, votes - 1);
				setVotes(newCount);
				if (onVote) onVote(String(itemId), newCount, voted);
			}
		} catch (err) {
			console.error("Error sending vote", err);
		} finally {
			setVoting(false);
		}
	};

	const handleDelete = async (e) => {
		e.stopPropagation();
		if (
			!window.confirm(
				"Estas a puntito de eliminar este item... ¿Aceptas?",
			)
		)
			return;
		setDeleting(true);
		try {
			const response = await fetch(`/api/items/${itemId}`, {
				method: "DELETE",
				headers: {
					...(token ? { "X-User-Token": token } : {}),
				},
			});
			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(
					data.detail || "Error al eliminar la recomendacion",
				);
			}
			if (onRecommendationDeleted) onRecommendationDeleted(itemId);
		} catch (error) {
			console.error("Error deleting recommendation:", error);
			alert("Error al eliminar: " + error.message);
		} finally {
			setDeleting(false);
		}
	};

	const handleEdit = (e) => {
		e.stopPropagation();
		const editPath = isJuegos ? "/juegos/editar/" : "/pelis/editar/";
		navigate(`${editPath}${itemId}`);
	};

	const handleVerMas = (e) => {
		if (e?.stopPropagation) e.stopPropagation();
		setShowVerItem(true);
	};

	const caratulaClass =
		Estado === "Recomendacion"
			? "item-caratula item-caratula-recomendacion"
			: "item-caratula";

	return (
		<>
			<div
				className={caratulaClass}
				onMouseEnter={() => setHover(true)}
				onMouseLeave={() => setHover(false)}
			>
				{canDelete && (
					<button
						className="item-delete-btn"
						onClick={handleDelete}
						disabled={deleting}
						aria-label="Eliminar recomendacion"
					>
						<MaterialSymbolsClose />
					</button>
				)}
				{isAdmin && user && itemId && (
					<button
						className="item-edit-btn"
						onClick={handleEdit}
						aria-label="Editar item"
					>
						<MaterialSymbolsEdit />
					</button>
				)}
				{Estado === "Recomendacion" && (
					<div className="item-nombre-superpuesta">
						<div className="item-header-user">
							{userSheet?.pfp ? (
								<img
									src={userSheet.pfp}
									alt={userSheet.nombre || "Usuario"}
									className="item-usuario-avatar"
									style={{
										width: 18,
										height: 18,
										borderRadius: "50%",
										marginRight: 6,
										verticalAlign: "middle",
									}}
								/>
							) : null}
							<span>{userSheet?.nombre || "Usuario"}</span>
						</div>
						<div
							className={`item-header-votos${hasVoted ? " voted" : ""}${user ? " user-logged" : ""}${isOwnRecommendation ? " own-recommendation" : ""}${voting ? " voting" : ""}`}
							onClick={handleVote}
							role="button"
							aria-label={
								isOwnRecommendation
									? "No puedes votar tu propia recomendación"
									: "Votar"
							}
							tabIndex={
								user &&
								!voting &&
								!hasVoted &&
								!isOwnRecommendation
									? 0
									: -1
							}
						>
							<button
								className="vote-btn"
								disabled={
									!user || voting || isOwnRecommendation
								}
								aria-label={
									isOwnRecommendation
										? "No puedes votar tu propia recomendación"
										: "Votar"
								}
							>
								<Fa7SolidThumbsUp
									style={{ fontSize: 14 }}
									className={
										user
											? hasVoted
												? "voted-icon"
												: ""
											: "disabled-icon"
									}
								/>
							</button>
							<span className="vote-count">{votes}</span>
						</div>
					</div>
				)}
				<div className="item-img-wrapper">
					{(Estado === "Pausado" || Estado === "Dropeado") && (
						<div
							className={`item-estado-badge item-estado-badge--${Estado.toLowerCase()}`}
						>
							{Estado}
						</div>
					)}
					{Duracion && (
						<div className="item-duracion-superpuesta">
							<MaterialSymbolsAlarm
								style={{ marginRight: 4, marginBottom: -2 }}
							/>
							{Duracion}
						</div>
					)}
					{URL && (
						<button
							className="item-url-btn"
							onClick={(e) => {
								e.stopPropagation();
								window.open(URL, "_blank");
							}}
						>
							<MaterialSymbolsPlayArrowRounded className="item-url-icon" />
						</button>
					)}
					{Estado === "Recomendacion"
						? Nota_Global && (
								<div className="item-nota-superpuesta">
									<MaterialSymbolsLightKidStar
										style={{
											marginRight: 4,
											marginBottom: -2,
										}}
									/>
									{Number(Nota_Global)
										.toFixed(2)
										.replace(/\.?0+$/, "")}
									/10
								</div>
							)
						: Nota && (
								<div className="item-nota-superpuesta">
									<MaterialSymbolsLightKidStar
										style={{
											marginRight: 4,
											marginBottom: -2,
										}}
									/>
									{Number(Nota)
										.toFixed(2)
										.replace(/\.?0+$/, "")}
									/10
								</div>
							)}
					<div
						style={{
							position: "relative",
							width: "100%",
							height: "100%",
						}}
					>
						<img
							src={Caratula}
							alt={`Caratula de ${Nombre ? Nombre.replace(/\s*\[[^\]]*\]$/, "") : ""}`}
							className={
								Estado === "Recomendacion"
									? "item-img item-img-recomendacion"
									: "item-img"
							}
						/>
						{Estado === "Recomendacion" && hover && Comentario && (
							<div className="item-comentario-overlay">
								<MaterialSymbolsAndroidMessages className="item-comentario-icon" />
								<span className="item-comentario-texto">
									{"\u00A0\u00A0\u00A0"}
									{Comentario}
								</span>
							</div>
						)}
					</div>
					<div
						className={
							Estado === "Recomendacion"
								? "item-img-overlay-recomendacion"
								: "item-img-overlay-normal"
						}
					/>
					{Estado !== "Recomendacion" && Fecha && (
						<div className="item-fecha-superpuesta">{Fecha}</div>
					)}
				</div>
				{Nombre ? (
					hover ? (
						<div className="item-hover-buttons">
							{Trailer && (
								<button
									className="item-trailer-btn"
									onClick={(e) => {
										e.stopPropagation();
										window.open(Trailer, "_blank");
									}}
								>
									<span>Trailer</span>
								</button>
							)}
							<button
								className="item-info-btn"
								onClick={(e) => {
									e.stopPropagation();
									handleVerMas();
								}}
								aria-label="Ver más información"
							>
								<IconamoonInformationCircleBold className="item-info-icon" />
							</button>
						</div>
					) : null
				) : null}
				<div className="item-nombre">
					{Nombre ? Nombre.replace(/\s*\[[^\]]*\]$/, "") : ""}
				</div>{" "}
			</div>
			{showVerItem && (
				<Suspense
					fallback={
						<div
							style={{
								position: "fixed",
								inset: 0,
								zIndex: 9999,
								background: "rgba(0,0,0,0.78)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<div
								style={{
									background: "var(--row-bg)",
									borderRadius: 12,
									padding: 48,
									border: "1px solid var(--border)",
									textAlign: "center",
									color: "var(--text-2)",
									fontSize: 14,
								}}
							>
								Cargando...
							</div>
						</div>
					}
				>
					<VerItem
						id={itemId}
						isJuegos={isJuegos}
						onClose={() => setShowVerItem(false)}
						onVote={(newCount, voted) => {
							setVotes(newCount);
							setHasVoted(voted);
							if (onVote && !isOwnRecommendation)
								onVote(String(itemId), newCount, voted);
						}}
					/>
				</Suspense>
			)}
		</>
	);
}
