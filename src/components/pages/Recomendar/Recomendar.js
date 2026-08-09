import React from "react";
import { useLocation } from "react-router-dom";
import RecomendarBase from "../Items/RecomendarBase";
import { JUEGO_SEARCH, PELI_SEARCH } from "../../../constants/searchConfigs";

const JUEGOS_CONFIG = {
	tipo: "Juego",
	labels: {
		title: "Juegos Recomendados",
		titleRecomendar: "Recomendar Juego",
		searchPlaceholder: "Nombre del juego a recomendar...",
		duplicateMessage: "Este juego ya ha sido recomendado o jugado...",
	},
	gridClass: "juegos-grid",
	searchApiUrl: JUEGO_SEARCH.apiUrl,
	buildSearchBody: JUEGO_SEARCH.buildBody,
	normalizeSearchResult: JUEGO_SEARCH.normalizeResult,
	needsPlatformSelector: true,
};

const PELIS_CONFIG = {
	tipo: "Pelicula",
	labels: {
		title: "Peliculas o Series Recomendadas",
		titleRecomendar: "Recomendar Pelicula o Serie",
		searchPlaceholder: "Nombre de la pelicula o serie a recomendar...",
		duplicateMessage:
			"Esta pelicula o serie ya ha sido recomendada o vista...",
	},
	gridClass: "pelis-grid",
	searchApiUrl: PELI_SEARCH.apiUrl,
	buildSearchBody: PELI_SEARCH.buildBody,
	normalizeSearchResult: PELI_SEARCH.normalizeResult,
	needsPlatformSelector: false,
};

function Recomendar() {
	const location = useLocation();
	const isJuegos = location.pathname.includes("/juegos");

	return <RecomendarBase config={isJuegos ? JUEGOS_CONFIG : PELIS_CONFIG} />;
}

export default Recomendar;
