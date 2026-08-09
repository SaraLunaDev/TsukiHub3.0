import { useState, useEffect, useRef, useCallback } from "react";

export function useEmoteLayout(showEmotesTable, emotesUsers) {
	const [emotesRowLines, setEmotesRowLines] = useState({});
	const [maxEmotesPerRow, setMaxEmotesPerRow] = useState({});
	const emotesTableRef = useRef(null);

	const maxEmotesPerRowRef = useRef({});

	useEffect(() => {
		const emotesTable = emotesTableRef.current;
		if (!emotesTable || !showEmotesTable) return;

		const updateMaxEmotes = () => {
			const rows = emotesTable.querySelectorAll("tbody tr");
			const newMap = {};

			rows.forEach((row, rowIndex) => {
				const emotesContainer = row.querySelector(".emotes-container");
				if (!emotesContainer) return;

				const emoteLinks = Array.from(
					emotesContainer.querySelectorAll("a"),
				);
				if (emoteLinks.length === 0) return;

				const containerWidth = emotesContainer.offsetWidth;
				const buttonWidth = 36;
				const gap = 4;
				const availableWidthFull = containerWidth;
				const availableWidthWithButton = containerWidth - buttonWidth;

				let accumulatedWidth = 0;
				let allFit = true;

				for (let i = 0; i < emoteLinks.length; i++) {
					const link = emoteLinks[i];
					const emote = link.querySelector(".emote-icon");
					if (!emote) continue;

					const originalDisplay = link.style.display;
					link.style.display = "inline-block";

					const emoteRect = emote.getBoundingClientRect();
					const emoteWidth = emoteRect.width || 24;

					link.style.display = originalDisplay;

					const widthWithGap = emoteWidth + (i > 0 ? gap : 0);
					accumulatedWidth += widthWithGap;

					if (accumulatedWidth > availableWidthFull) {
						allFit = false;
						break;
					}
				}

				if (allFit) {
					newMap[rowIndex] = emoteLinks.length;
				} else {
					accumulatedWidth = 0;
					let maxEmotes = 0;

					for (let i = 0; i < emoteLinks.length; i++) {
						const link = emoteLinks[i];
						const emote = link.querySelector(".emote-icon");
						if (!emote) continue;

						const originalDisplay = link.style.display;
						link.style.display = "inline-block";

						const emoteRect = emote.getBoundingClientRect();
						const emoteWidth = emoteRect.width || 24;

						link.style.display = originalDisplay;

						const widthWithGap = emoteWidth + (i > 0 ? gap : 0);
						const newTotal = accumulatedWidth + widthWithGap;

						if (newTotal <= availableWidthWithButton) {
							maxEmotes++;
							accumulatedWidth = newTotal;
						} else {
							break;
						}
					}

					newMap[rowIndex] = Math.max(2, maxEmotes);
				}
			});

			const prev = maxEmotesPerRowRef.current;
			const hasChanges =
				Object.keys(newMap).some((key) => newMap[key] !== prev[key]) ||
				Object.keys(prev).length !== Object.keys(newMap).length;

			if (hasChanges) {
				maxEmotesPerRowRef.current = newMap;
				setMaxEmotesPerRow(newMap);
			}
		};

		const images = emotesTable.querySelectorAll(".emote-icon");
		let loadedCount = 0;
		const totalImages = images.length;

		const checkAllLoaded = () => {
			loadedCount++;
			if (loadedCount >= totalImages) {
				setTimeout(updateMaxEmotes, 50);
			}
		};

		if (totalImages === 0) {
			updateMaxEmotes();
		} else {
			images.forEach((img) => {
				if (img.complete) {
					checkAllLoaded();
				} else {
					img.addEventListener("load", checkAllLoaded);
					img.addEventListener("error", checkAllLoaded);
				}
			});
		}

		let resizeTimer;
		const handleResize = () => {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(updateMaxEmotes, 50);
		};

		window.addEventListener("resize", handleResize);
		const observer = new window.ResizeObserver(handleResize);
		observer.observe(emotesTable);

		return () => {
			clearTimeout(resizeTimer);
			window.removeEventListener("resize", handleResize);
			observer.disconnect();
			images.forEach((img) => {
				img.removeEventListener("load", checkAllLoaded);
				img.removeEventListener("error", checkAllLoaded);
			});
		};
	}, [showEmotesTable, emotesUsers]);

	const cycleEmoteLine = useCallback((rowIndex, totalLines) => {
		setEmotesRowLines((prev) => {
			const currentLine = prev[rowIndex] || 0;
			const nextLine = (currentLine + 1) % totalLines;
			if (nextLine === 0) {
				const newState = { ...prev };
				delete newState[rowIndex];
				return newState;
			}
			return { ...prev, [rowIndex]: nextLine };
		});
	}, []);

	return { emotesTableRef, emotesRowLines, maxEmotesPerRow, cycleEmoteLine };
}

export default useEmoteLayout;
