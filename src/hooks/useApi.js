import { useState, useEffect, useCallback, useRef } from "react";
import { RATE_LIMIT_MSG, API_STATUS_ERROR_MSG } from "../constants";

const MIN_LOADING_MS = 600;
const CACHE_TTL_MS = 60_000;

const apiCache = new Map();
const fetchPromises = new Map();
const apiFetchPromises = new Map();

function isCacheValid(entry) {
	return entry && Date.now() - entry.ts <= CACHE_TTL_MS;
}

function getCachedData(url) {
	const entry = apiCache.get(url);
	if (!entry) return null;
	if (!isCacheValid(entry)) {
		apiCache.delete(url);
		return null;
	}
	return entry.data;
}

export function clearApiCache(urlPrefix) {
	for (const key of apiCache.keys()) {
		if (key.startsWith(urlPrefix)) {
			apiCache.delete(key);
		}
	}
}

export async function apiFetch(url, options = {}) {
	const method = (options.method || "GET").toUpperCase();

	if (method === "GET") {
		const cachedData = getCachedData(url);
		if (cachedData !== null) {
			return new Response(JSON.stringify(cachedData), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (apiFetchPromises.has(url)) {
			return apiFetchPromises.get(url).then((res) => res.clone());
		}
	}

	const fetchOptions =
		method === "GET" ? { ...options, cache: "no-store" } : options;

	const promise = fetch(url, fetchOptions)
		.then((res) => {
			if (method === "GET" && res.ok) {
				const cloned = res.clone();
				cloned
					.json()
					.then((json) => {
						apiCache.set(url, { data: json, ts: Date.now() });
					})
					.catch(() => {});
			}
			return res;
		})
		.finally(() => {
			if (method === "GET") {
				apiFetchPromises.delete(url);
			}
		});

	if (method === "GET") {
		apiFetchPromises.set(url, promise);
	}

	return method === "GET" ? promise.then((res) => res.clone()) : promise;
}

export function useApi(endpoint, options = {}) {
	const { enabled = true } = options;

	const cachedData = getCachedData(endpoint);

	const [data, setData] = useState(() =>
		cachedData !== null ? cachedData : null,
	);
	const [loading, setLoading] = useState(
		() => enabled && cachedData === null,
	);
	const [error, setError] = useState(null);
	const [rateLimitError, setRateLimitError] = useState(null);
	const [statusError, setStatusError] = useState(null);

	const hasFetchedRef = useRef(cachedData !== null);
	const lastEndpointRef = useRef(endpoint);
	const mountedRef = useRef(true);
	const loadingStartRef = useRef(Date.now());
	const requestIdRef = useRef(0);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	const doFetchRef = useRef(null);
	doFetchRef.current = async () => {
		if (!enabled || !endpoint) {
			setLoading(false);
			return;
		}

		const requestId = ++requestIdRef.current;
		loadingStartRef.current = Date.now();
		setLoading(true);
		setError(null);
		setRateLimitError(null);
		setStatusError(null);

		let promise;
		if (fetchPromises.has(endpoint)) {
			promise = fetchPromises.get(endpoint);
		} else {
			promise = fetch(endpoint)
				.then(async (res) => {
					if (!res.ok) {
						if (res.status === 429) {
							throw new Error("RATE_LIMIT");
						}
						const text = await res.text();
						let detail = text;
						try {
							detail = JSON.parse(text).detail || text;
						} catch {}
						throw new Error(detail || `HTTP ${res.status}`);
					}
					const json = await res.json();
					apiCache.set(endpoint, { data: json, ts: Date.now() });
					return json;
				})
				.finally(() => {
					fetchPromises.delete(endpoint);
				});
			fetchPromises.set(endpoint, promise);
		}

		try {
			const json = await promise;
			setData(json);
		} catch (err) {
			if (err.message === "RATE_LIMIT") {
				setRateLimitError(RATE_LIMIT_MSG);
			} else {
				setError(err.message);
				setStatusError(API_STATUS_ERROR_MSG);
			}
		} finally {
			const elapsed = Date.now() - loadingStartRef.current;
			const delay = Math.max(0, MIN_LOADING_MS - elapsed);
			setTimeout(() => {
				if (!mountedRef.current) return;
				if (requestIdRef.current !== requestId) return;
				setLoading(false);
			}, delay);
		}
	};

	useEffect(() => {
		if (hasFetchedRef.current && lastEndpointRef.current === endpoint)
			return;
		const cachedHit = getCachedData(endpoint);
		if (endpoint && cachedHit !== null) {
			setData(cachedHit);
			setLoading(false);
			hasFetchedRef.current = true;
			lastEndpointRef.current = endpoint;
			return;
		}
		hasFetchedRef.current = true;
		lastEndpointRef.current = endpoint;
		doFetchRef.current();
	}, [endpoint, enabled]);

	const refetch = useCallback(() => {
		apiCache.delete(endpoint);
		doFetchRef.current();
	}, [endpoint]);

	return { data, loading, error, rateLimitError, statusError, refetch };
}

export default useApi;
