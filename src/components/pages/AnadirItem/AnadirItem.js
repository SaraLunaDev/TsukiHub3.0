import React from "react";
import { useLocation } from "react-router-dom";
import AnadirItemBase from "../Items/AnadirItemBase";
import { JUEGO_SEARCH, PELI_SEARCH } from "../../../constants/searchConfigs";

const JUEGOS_CONFIG = {
	tipo: "Juego",
	labels: {
		title: "Añadir Juego",
		searchPlaceholder: "Buscar juego para añadir...",
	},
	searchApiUrl: JUEGO_SEARCH.apiUrl,
	buildSearchBody: JUEGO_SEARCH.buildBody,
	normalizeSearchResult: JUEGO_SEARCH.normalizeResult,
	getTipoValueOnSelect: (result) =>
		Array.isArray(result.tipo) ? result.tipo[0] || "" : result.tipo || "",
};

const PELIS_CONFIG = {
	tipo: "Pelicula",
	labels: {
		title: "Añadir Pelicula/Serie",
		searchPlaceholder: "Buscar pelicula o serie para añadir...",
	},
	searchApiUrl: PELI_SEARCH.apiUrl,
	buildSearchBody: PELI_SEARCH.buildBody,
	normalizeSearchResult: PELI_SEARCH.normalizeResult,
	getTipoValueOnSelect: (result) => result.raw?.tipo || result.tipo || "",
};

function AnadirItem() {
	const location = useLocation();
	const isJuegos = location.pathname.includes("/juegos");

	return <AnadirItemBase config={isJuegos ? JUEGOS_CONFIG : PELIS_CONFIG} />;
}

export default AnadirItem;
