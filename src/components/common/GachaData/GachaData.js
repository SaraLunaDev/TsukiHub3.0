import React from "react";
import "./GachaData.css";
import HoverCard from "../HoverCard/HoverCard";

function GachaData({
	selectedCharacter,
	banner,
	ownedCount,
	totalCharacters,
	tier5Count,
}) {
	const hasCard = !!selectedCharacter;
	const bannerId = banner || selectedCharacter?.banner || "";

	return (
		<div className="gacha-data normal-section">
			<div className="gacha-stats-row">
				<span>
					<b>{ownedCount}</b> / <b>{totalCharacters}</b> personajes
				</span>
				<span>
					{tier5Count} - <b>5★</b>
				</span>
			</div>
			<div className="gacha-display-section">
				<HoverCard
					src={hasCard ? selectedCharacter.imagenUrl : undefined}
					alt={hasCard ? selectedCharacter.name : undefined}
					banner={hasCard ? bannerId : undefined}
					tier={hasCard ? selectedCharacter.tier : undefined}
					lockToBack={!hasCard}
				/>
			</div>
		</div>
	);
}

export default GachaData;
