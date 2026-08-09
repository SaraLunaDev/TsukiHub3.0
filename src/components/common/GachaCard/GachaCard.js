import React, { useState } from "react";
import "./GachaCard.css";

function GachaCard({ character, onClick }) {
	const [imageLoaded, setImageLoaded] = useState(false);
	const [imageError, setImageError] = useState(false);

	const handleLoad = () => setImageLoaded(true);
	const handleError = () => setImageError(true);

	const handleClick = () => {
		if (character.owned && onClick) {
			onClick(character);
		}
	};

	if (!character.id) {
		return <div className="gacha-card empty-slot"></div>;
	}

	const showBack = !character.owned || imageError;

	return (
		<div
			className={`gacha-card ${character.owned ? "owned" : "unowned"}`}
			onClick={handleClick}
			style={{ cursor: character.owned ? "pointer" : "default" }}
		>
			<img
				src={
					showBack
						? "/static/resources/gacha/back.webp"
						: character.imagenUrl
				}
				alt={character.owned ? character.name : "back"}
				className={`gacha-img ${imageLoaded ? "loaded" : ""} ${showBack ? "back-img" : ""}`}
				onLoad={handleLoad}
				onError={handleError}
			/>
		</div>
	);
}

export default GachaCard;
