import { useState, useEffect, useRef } from "react";

export function useAchievementLayout(achievements) {
	const [maxUsersMap, setMaxUsersMap] = useState({});
	const achievementsGridRef = useRef(null);

	const maxUsersMapRef = useRef({});

	useEffect(() => {
		const grid = achievementsGridRef.current;
		if (!grid) return;

		const updateMaxUsers = () => {
			const sections = grid.querySelectorAll(".achievement-section");
			const newMap = {};
			sections.forEach((section) => {
				const usersRow = section.querySelector(".achievement-users");
				if (!usersRow) return;
				const avatarWidth = 27;
				const moreWidth = 38;
				const available = usersRow.offsetWidth - 8;
				const max = Math.max(
					2,
					Math.floor((available - moreWidth) / avatarWidth) + 1,
				);
				const key = section.getAttribute("data-achievement-key");
				if (key) newMap[key] = max;
			});

			const prev = maxUsersMapRef.current;
			const hasChanges =
				Object.keys(newMap).some((key) => newMap[key] !== prev[key]) ||
				Object.keys(prev).length !== Object.keys(newMap).length;

			if (hasChanges) {
				maxUsersMapRef.current = newMap;
				setMaxUsersMap(newMap);
			}
		};

		updateMaxUsers();
		window.addEventListener("resize", updateMaxUsers);
		const observer = new window.ResizeObserver(updateMaxUsers);
		observer.observe(grid);

		return () => {
			window.removeEventListener("resize", updateMaxUsers);
			observer.disconnect();
		};
	}, [achievements]);

	return { achievementsGridRef, maxUsersMap };
}

export default useAchievementLayout;
