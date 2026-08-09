export const getRowId = (row) => row?.ID ?? row?.Id ?? row?.id ?? "";
export const getUserById = (usuariosData, id) => {
	if (!usuariosData || !id) return null;
	const found = usuariosData.find(
		(u) => String(u.id).trim() === String(id).trim(),
	);
	if (!found) return null;
	return { ...found, pfp: found.imagen_perfil || "" };
};
export const formatDuration = (mins) => {
	if (mins == null || mins === "") return mins;
	const n = typeof mins === "string" ? parseFloat(mins) : mins;
	if (isNaN(n) || n <= 0) return mins;
	const h = Math.floor(n / 60);
	const m = Math.round(n % 60);
	if (h > 0 && m > 0) return `${h}h ${m}m`;
	if (h > 0) return `${h}h`;
	return `${m}m`;
};
export const normalizeItemRow = (row) => {
	if (!row) return row;
	const userId = row.usuario_id || row.Usuario || "";
	const itemId = row.id || row.ID || row.Id || "";
	return {
		...row,
		ID: itemId ? String(itemId) : "",
		Nombre: row.nombre || row.Nombre,
		Estado: row.estado || row.Estado,
		Tipo: row.plataforma || row.Tipo,
		Fecha: row.fecha || row.Fecha,
		Duracion: formatDuration(row.duracion || row.Duracion),
		Nota: row.nota || row.Nota,
		Link: row.youtube_url || row.Link,
		URL: row.youtube_url || row.URL || row.Link,
		Caratula: row.caratula || row.Caratula,
		Imagen: row.imagen || row.Imagen,
		Trailer: row.trailer || row.Trailer,
		Generos: row.generos || row.Generos,
		Resumen: row.resumen || row.Resumen,
		Fecha_Salida: row.fecha_salida || row.Fecha_Salida,
		Nota_Global: row.nota_global || row.Nota_Global,
		Creador: row.creador || row.Creador,
		Usuario: userId,
		Comentario: row.comentario || "",
	};
};
export const parseAnyDate = (val) => {
	if (!val) return 0;
	if (typeof val === "number") return val;
	if (typeof val === "string") {
		const parts = val.split("/");
		if (parts.length === 3) {
			const [d, m, y] = parts;
			const iso = `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
			const time = Date.parse(iso);
			return isNaN(time) ? 0 : time;
		}
		const parsed = Date.parse(val);
		return isNaN(parsed) ? 0 : parsed;
	}
	return 0;
};
export const cleanType = (str) =>
	str ? str.replace(/\s*\(.*?\)\s*/g, "").trim() : "";
export const parseDuration = (val) => {
	if (val == null || val === "") return 0;
	if (typeof val === "number") return val;
	const str = String(val).replace(/\s+/g, "").toLowerCase();
	const numMatch = str.match(/^(\d+)$/);
	if (numMatch) return parseInt(numMatch[1], 10);
	let h = 0,
		m = 0;
	const hMatch = str.match(/(\d+)h/);
	const mMatch = str.match(/(\d+)m/);
	if (hMatch) h = parseInt(hMatch[1], 10);
	if (mMatch) m = parseInt(mMatch[1], 10);
	return h * 60 + m;
};
export const parseSlashDate = (d) => {
	if (!d) return 0;
	const [day, month, year] = d.split("/").map(Number);
	return new Date(year, month - 1, day).getTime();
};

export const createItemSorter = (order) => (a, b) => {
	switch (order) {
		case "asc":
			return (
				parseSlashDate(a.fecha || a.Fecha) -
				parseSlashDate(b.fecha || b.Fecha)
			);
		case "name-az":
			return (a.nombre || a.Nombre || "").localeCompare(
				b.nombre || b.Nombre || "",
			);
		case "name-za":
			return (b.nombre || b.Nombre || "").localeCompare(
				a.nombre || a.Nombre || "",
			);
		case "nota-desc":
			return (
				(Number(b.nota || b.Nota) || 0) -
				(Number(a.nota || a.Nota) || 0)
			);
		case "nota-asc":
			return (
				(Number(a.nota || a.Nota) || 0) -
				(Number(b.nota || b.Nota) || 0)
			);
		case "duracion-desc":
			return (
				parseDuration(b.duracion || b.Duracion) -
				parseDuration(a.duracion || a.Duracion)
			);
		case "duracion-asc":
			return (
				parseDuration(a.duracion || a.Duracion) -
				parseDuration(b.duracion || b.Duracion)
			);
		case "desc":
		default:
			return (
				parseSlashDate(b.fecha || b.Fecha) -
				parseSlashDate(a.fecha || a.Fecha)
			);
	}
};
