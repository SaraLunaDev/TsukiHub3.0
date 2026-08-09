import { useState, useEffect } from "react";

export function useItemSearch(config) {
	const [search, setSearch] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [searchError, setSearchError] = useState("");

	useEffect(() => {
		if (!search || search.length < 2) {
			setSearchResults([]);
			setSearchError("");
			return;
		}
		setSearchLoading(true);
		setSearchError("");
		const timeout = setTimeout(() => {
			const doSearch = async () => {
				try {
					const res = await fetch(config.searchApiUrl, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(config.buildSearchBody(search)),
					});
					const data = await res.json();
					if (!res.ok || !data.results)
						throw new Error(data.error || "Error en busqueda");

					const normalized = data.results.map(
						config.normalizeSearchResult,
					);
					setSearchResults(normalized);
				} catch (e) {
					setSearchError(e.message);
					setSearchResults([]);
				} finally {
					setSearchLoading(false);
				}
			};
			doSearch();
		}, 400);
		return () => clearTimeout(timeout);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		search,
		config.searchApiUrl,
		config.buildSearchBody,
		config.normalizeSearchResult,
	]);

	return {
		search,
		setSearch,
		searchResults,
		setSearchResults,
		searchLoading,
		searchError,
	};
}

export default useItemSearch;
