export const fixUrl = (url) => {
	if (!url) return undefined;
	if (url.startsWith("http")) return url;
	if (url.startsWith("//")) return "https:" + url;
	return url;
};
export const JUEGO_SEARCH = {
	apiUrl: "/api/search/igdb",
	buildBody: (query) => ({ query }),
	normalizeResult: (item) => ({
		id: item.id,
		nombre: item.nombre || item.name,
		caratula: fixUrl(item.caratula || item.cover?.url),
		imagen: fixUrl(item.imagen),
		fecha:
			item.fecha ||
			(item.first_release_date
				? new Date(item.first_release_date * 1000).getFullYear()
				: undefined),
		generos: item.generos || item.genres?.map((g) => g.name) || [],
		resumen: item.resumen || item.summary,
		trailer: item.trailer,
		tipo: item.tipo || "juego",
		creador: item.creador,
		nota_global:
			typeof item.nota_global === "number"
				? (item.nota_global / 10).toFixed(1)
				: item.nota_global,
		duracion: item.duracion,
		raw: item,
	}),
};
export const PELI_SEARCH = {
	apiUrl: "/api/search/tmdb",
	buildBody: (query) => ({ query, type: "multi" }),
	normalizeResult: (item) => ({
		id: item.id,
		nombre: item.nombre || item.title || item.name,
		caratula:
			item.caratula ||
			(item.poster_path || item.backdrop_path
				? `https://image.tmdb.org/t/p/w185${item.poster_path || item.backdrop_path}`
				: undefined),
		fecha: item.fecha || item.release_date || item.first_air_date,
		generos:
			item.generos ||
			(item.genres
				? typeof item.genres === "string"
					? item.genres.split(",")
					: item.genres
				: []),
		resumen: item.resumen || item.overview,
		trailer: item.trailer_url || item.trailer,
		tipo: item.tipo || item.media_type,
		creador: item.creador,
		nota_global: item.nota_global,
		duracion: item.duracion,
		imagen: item.imagen,
		raw: item,
	}),
};
