import dotenv from "dotenv";
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL;
const API_KEY = process.env.API_KEY;

async function apiFetch(endpoint, options = {}) {
	if (!API_KEY) {
		throw new Error("API_KEY no configurada en el servidor");
	}

	const url = `${API_BASE_URL}${endpoint}`;
	const headers = {
		"X-API-Key": API_KEY,
		"Content-Type": "application/json",
		...options.headers,
	};

	const res = await fetch(url, { ...options, headers });

	if (!res.ok) {
		const text = await res.text();
		let detail = text;
		try {
			const json = JSON.parse(text);
			detail =
				typeof json.detail === "string"
					? json.detail
					: json.detail
						? JSON.stringify(json.detail)
						: text;
		} catch {}
		const err = new Error(detail);
		err.status = res.status;
		throw err;
	}

	if (res.status === 204) return null;
	return res.json();
}

export { apiFetch };
