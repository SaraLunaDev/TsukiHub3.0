import { useMemo } from "react";
import { useApi } from "./useApi";

function buildEndpoint(base, search) {
	let url = base;
	if (search) url += `&search=${encodeURIComponent(search)}`;
	return url;
}

export function useDashboardData(debouncedSearch) {
	const rachaEndpoint = useMemo(
		() =>
			buildEndpoint(
				"/api/usuarios/dashboard/rachas?limit=10",
				debouncedSearch.racha,
			),
		[debouncedSearch.racha],
	);
	const mensajesEndpoint = useMemo(
		() =>
			buildEndpoint(
				"/api/usuarios/dashboard/mensajes?limit=10",
				debouncedSearch.mensajes,
			),
		[debouncedSearch.mensajes],
	);
	const ticketsEndpoint = useMemo(
		() =>
			buildEndpoint(
				"/api/usuarios/dashboard/tickets?limit=10",
				debouncedSearch.tickets,
			),
		[debouncedSearch.tickets],
	);
	const emotesEndpoint = useMemo(
		() =>
			buildEndpoint(
				"/api/usuarios/dashboard/emotes?limit=10",
				debouncedSearch.emotes,
			),
		[debouncedSearch.emotes],
	);
	const {
		data: rachasData,
		loading: rachasLoading,
		rateLimitError: rachasRateLimit,
		statusError: rachasStatusError,
	} = useApi(rachaEndpoint);
	const {
		data: mensajesData,
		loading: mensajesLoading,
		rateLimitError: mensajesRateLimit,
		statusError: mensajesStatusError,
	} = useApi(mensajesEndpoint);
	const {
		data: ticketsData,
		loading: ticketsLoading,
		rateLimitError: ticketsRateLimit,
		statusError: ticketsStatusError,
	} = useApi(ticketsEndpoint);
	const {
		data: emotesData,
		loading: emotesLoading,
		rateLimitError: emotesRateLimit,
		statusError: emotesStatusError,
	} = useApi(emotesEndpoint);
	const {
		data: logrosData,
		loading: logrosLoading,
		rateLimitError: logrosRateLimit,
		statusError: logrosStatusError,
	} = useApi("/api/usuarios/dashboard/logros?limit=50");
	const {
		data: totalesData,
		loading: totalesLoading,
		rateLimitError: totalesRateLimit,
		statusError: totalesStatusError,
	} = useApi("/api/usuarios/dashboard/totales");

	const rachasUsers = useMemo(() => {
		if (!rachasData?.length) return [];
		return rachasData
			.filter((u) => u.nombre)
			.map((u) => {
				const rachaNum = u.racha || 0;
				const mantenida = u.mantenida === true;
				const congelada = u.congelada === true;
				let rachaDisplay;
				if (congelada) rachaDisplay = `f_${rachaNum}`;
				else if (!mantenida) rachaDisplay = `m_${rachaNum}`;
				else rachaDisplay = String(rachaNum);
				return {
					id: u.id,
					nombre: u.nombre,
					pfp: u.imagen_perfil || "",
					racha: rachaDisplay,
				};
			});
	}, [rachasData]);

	const mensajesUsers = useMemo(() => {
		if (!mensajesData?.length) return [];
		return mensajesData
			.filter((u) => u.nombre)
			.map((u) => ({
				id: u.id,
				nombre: u.nombre,
				pfp: u.imagen_perfil || "",
				mensajes: u.mensajes || 0,
			}));
	}, [mensajesData]);

	const ticketsUsers = useMemo(() => {
		if (!ticketsData?.length) return [];
		return ticketsData
			.filter((u) => u.nombre)
			.map((u) => ({
				id: u.id,
				nombre: u.nombre,
				pfp: u.imagen_perfil || "",
				tickets: typeof u.tickets === "number" ? u.tickets : 0,
			}));
	}, [ticketsData]);

	const emotesUsers = useMemo(() => {
		if (!emotesData?.length) return [];
		return emotesData
			.filter((u) => u.nombre)
			.map((u) => ({
				id: u.id,
				nombre: u.nombre,
				pfp: u.imagen_perfil || "",
				emotes: Array.isArray(u.emotes) ? u.emotes : [],
			}));
	}, [emotesData]);

	const achievementDetails = useMemo(() => {
		if (!logrosData?.logros?.length) return {};
		const details = {};
		logrosData.logros.forEach((l) => {
			details[l.codigo] = {
				name: l.titulo,
				description: l.descripcion,
				color: l.color || "#888888",
			};
		});
		return details;
	}, [logrosData]);

	const logrosUsuarios = useMemo(() => {
		if (!logrosData?.usuarios?.length) return [];
		return logrosData.usuarios
			.filter((u) => u.nombre)
			.map((u) => ({
				id: u.id,
				nombre: u.nombre,
				pfp: u.imagen_perfil || "",
				logros: Array.isArray(u.logros) ? u.logros : [],
			}));
	}, [logrosData]);

	const achievements = useMemo(() => {
		if (!logrosUsuarios.length) return {};
		const achievementUsers = {};
		Object.keys(achievementDetails).forEach((key) => {
			achievementUsers[key] = logrosUsuarios.filter((user) =>
				(user.logros || []).includes(key),
			);
		});
		return achievementUsers;
	}, [logrosUsuarios, achievementDetails]);

	const totalUsuarios = totalesData?.usuarios ?? 0;
	const rachasActivas = totalesData?.rachas_activas ?? 0;
	const totalMensajes = totalesData?.mensajes ?? 0;
	const totalTickets = totalesData?.tickets ?? 0;
	const totalEmotes = totalesData?.emotes ?? 0;
	const usuariosConLogros = totalesData?.usuarios_con_logros ?? 0;

	const platinoUsuarios = useMemo(
		() =>
			logrosUsuarios.filter((u) => (u.logros || []).includes("platino")),
		[logrosUsuarios],
	);
	const anyLoading =
		rachasLoading ||
		mensajesLoading ||
		ticketsLoading ||
		emotesLoading ||
		logrosLoading ||
		totalesLoading;

	const anyRateLimitError =
		rachasRateLimit ||
		mensajesRateLimit ||
		ticketsRateLimit ||
		emotesRateLimit ||
		logrosRateLimit ||
		totalesRateLimit;

	const anyStatusError =
		rachasStatusError ||
		mensajesStatusError ||
		ticketsStatusError ||
		emotesStatusError ||
		logrosStatusError ||
		totalesStatusError;

	return {
		rachasUsers,
		mensajesUsers,
		ticketsUsers,
		emotesUsers,
		achievementDetails,
		logrosUsuarios,
		achievements,
		platinoUsuarios,
		totalUsuarios,
		rachasActivas,
		totalMensajes,
		totalTickets,
		totalEmotes,
		usuariosConLogros,
		anyLoading,
		anyRateLimitError,
		anyStatusError,
	};
}

export default useDashboardData;
