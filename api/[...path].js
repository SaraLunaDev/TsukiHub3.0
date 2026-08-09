const API_BASE_URL = (process.env.API_BASE_URL || "").replace(/\/$/, "");
const API_KEY = process.env.API_KEY;
const PROXY_QUERY_KEY = "__p";

function readBody(req) {
	return new Promise((resolve) => {
		const chunks = [];
		req.on("data", (chunk) => chunks.push(chunk));
		req.on("end", () => resolve(Buffer.concat(chunks)));
		req.on("error", () => resolve(Buffer.alloc(0)));
	});
}

function getOriginalPath(req) {
	return req.query && req.query[PROXY_QUERY_KEY]
		? req.query[PROXY_QUERY_KEY]
		: req.url;
}

function buildUpstreamUrl(req) {
	const originalPath = getOriginalPath(req);
	const upstreamPath = originalPath.startsWith("/api")
		? originalPath.replace(/^\/api/, "")
		: originalPath;

	const qs = req.query
		? Object.entries(req.query)
				.filter(([k]) => k !== PROXY_QUERY_KEY)
				.map(
					([k, v]) =>
						`${k}=${encodeURIComponent(
							Array.isArray(v) ? v.join(",") : v,
						)}`,
				)
				.join("&")
		: "";

	return `${API_BASE_URL}${upstreamPath}${qs ? `?${qs}` : ""}`;
}

export default async function handler(req, res) {
	try {
		if (!API_BASE_URL || !API_KEY) {
			res.status(500).json({
				detail: "Faltan las variables",
			});
			return;
		}

		const originalPath = getOriginalPath(req);
		const headers = { "X-API-Key": API_KEY };

		if (req.headers["x-user-token"]) {
			headers["X-User-Token"] = req.headers["x-user-token"];
		}
		if (
			req.headers.authorization &&
			originalPath.startsWith("/api/auth/")
		) {
			headers["Authorization"] = req.headers.authorization;
		}

		let body;
		if (req.method !== "GET" && req.method !== "HEAD") {
			const raw = await readBody(req);
			body = raw.length ? raw : undefined;
			if (body) headers["Content-Type"] = "application/json";
		}

		const upstream = await fetch(buildUpstreamUrl(req), {
			method: req.method,
			headers,
			body,
		});

		const data = Buffer.from(await upstream.arrayBuffer());

		res.status(upstream.status);
		const contentType = upstream.headers.get("content-type");
		if (contentType) res.setHeader("Content-Type", contentType);
		const cacheControl = upstream.headers.get("cache-control");
		if (cacheControl) res.setHeader("Cache-Control", cacheControl);

		res.send(data);
	} catch (err) {
		res.status(502).json({ detail: err.message || "Error del proxy" });
	}
}
