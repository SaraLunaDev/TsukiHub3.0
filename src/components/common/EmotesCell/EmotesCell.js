import { MdiChevronUp } from "../../icons/MdiChevronUp";
import { MdiChevronDown } from "../../icons/MdiChevronDown";
import { FluentChevronUpDown16Filled } from "../../icons/FluentChevronUpDown16Filled";
import "./EmotesCell.css";

export default function EmotesCell({ row, cycleEmoteLine }) {
	const isFirstLine = row.currentLineIndex === 0;
	const isLastLine = row.currentLineIndex === row.totalLinesNeeded - 1;
	const isMiddleLine = !isFirstLine && !isLastLine;

	let ChevronIcon;
	let buttonClass;

	if (isLastLine) {
		ChevronIcon = MdiChevronUp;
		buttonClass = "emotes-collapse-btn";
	} else if (isMiddleLine) {
		ChevronIcon = FluentChevronUpDown16Filled;
		buttonClass = "emotes-expand-btn";
	} else {
		ChevronIcon = MdiChevronDown;
		buttonClass = "emotes-expand-btn";
	}

	return (
		<div className={`emotes-container${row.hasMany ? " has-chevron" : ""}`}>
			{row.allEmotes &&
				row.allEmotes.map((emoteId, emoteIndex) => {
					const isInCurrentLine =
						emoteIndex >= row.startIndex &&
						emoteIndex < row.endIndex;

					return (
						<a
							key={emoteIndex}
							href={`https://7tv.app/emotes/${emoteId}`}
							target="_blank"
							rel="noopener noreferrer"
							style={{
								display: isInCurrentLine
									? "inline-block"
									: "none",
							}}
						>
							<img
								src={`https://cdn.7tv.app/emote/${emoteId}/1x.webp`}
								alt={`Emote ${emoteIndex}`}
								className="emote-icon"
								onError={(e) => {
									e.target.style.display = "none";
								}}
								title={`Emote ${emoteIndex + 1}`}
							/>
						</a>
					);
				})}
			{row.hasMany && (
				<button
					className={buttonClass}
					title={`${row.currentLineIndex + 1} de ${row.totalLinesNeeded}`}
					onClick={() =>
						cycleEmoteLine(row.rowIndex, row.totalLinesNeeded)
					}
				>
					<ChevronIcon
						width={22}
						height={22}
						style={{ color: "var(--text-2)" }}
					/>
				</button>
			)}
		</div>
	);
}
