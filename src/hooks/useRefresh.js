import { createContext, useContext, useCallback } from "react";

const RefreshContext = createContext(null);

export function RefreshProvider({ children }) {
	const triggerRefresh = useCallback(() => {
		window.location.reload();
	}, []);

	return (
		<RefreshContext.Provider value={{ triggerRefresh }}>
			{children}
		</RefreshContext.Provider>
	);
}

export function useRefreshContext() {
	const ctx = useContext(RefreshContext);
	return ctx || { triggerRefresh: () => {} };
}
