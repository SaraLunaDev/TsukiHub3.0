import React from "react";
import Items from "../Items/Items";

const CONFIG = {
	tipo: "Pelicula",
	labels: {
		nowTitle: "Proximamente",
		planTitle: "Planeo Ver",
		completedTitle: "Peliculas y Series Vistas",
		emptyMessage: "No hay pelis disponibles, jope..",
		carouselKeyPrefix: "proximamente",
	},
	typeFilterLabel: "Tipo",
	gridClass: "pelis-grid",
};

function Pelis() {
	return <Items config={CONFIG} />;
}

export default Pelis;
