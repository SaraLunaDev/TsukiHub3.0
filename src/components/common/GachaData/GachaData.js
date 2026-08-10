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
			<div className="region-stats">
				<div className="region-stats-box header-box">
					<div className="region-stat-item">
						<span className="region-stat-label">Banner:</span>
						<span className="region-stat-value">
							<b>
								{ownedCount}/{totalCharacters}
							</b>
						</span>
					</div>
					<div className="region-stat-item">
						<span className="region-stat-label">Tier 5:</span>
						<span className="region-stat-value">
							<b>{tier5Count}</b>
						</span>
					</div>
				</div>
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
