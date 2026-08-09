import { useState, useEffect, useCallback } from "react";

export function useDebouncedSearch(initialFields = [], delay = 200) {
	const [searchInput, setSearchInput] = useState(() => {
		const initial = {};
		initialFields.forEach((f) => (initial[f] = ""));
		return initial;
	});

	const [debouncedSearch, setDebouncedSearch] = useState(() => {
		const initial = {};
		initialFields.forEach((f) => (initial[f] = ""));
		return initial;
	});

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchInput);
		}, delay);
		return () => clearTimeout(timer);
	}, [searchInput, delay]);

	const handleSearchChange = useCallback(
		(field) => (value) => {
			setSearchInput((prev) => ({ ...prev, [field]: value }));
		},
		[],
	);

	return { searchInput, debouncedSearch, handleSearchChange };
}

export default useDebouncedSearch;
