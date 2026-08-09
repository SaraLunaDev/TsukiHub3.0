import React from "react";
import Items from "../Items/Items";

const CONFIG = {
	tipo: "Juego",
	labels: {
		nowTitle: "Jugando",
		planTitle: "Planeo Jugar",
		completedTitle: "Juegos Jugados",
		emptyMessage: "No hay juegos disponibles, jope..",
		carouselKeyPrefix: "jugando",
	},
	typeFilterLabel: "Plataforma",
	gridClass: "juegos-grid",
};

function Juegos() {
	return <Items config={CONFIG} />;
}

export default Juegos;
