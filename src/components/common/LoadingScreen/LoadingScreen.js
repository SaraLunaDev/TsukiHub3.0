import LoadingRing from "../../icons/LoadingRing";
import "./LoadingScreen.css";

export { RATE_LIMIT_MSG } from "../../../constants";

export default function LoadingScreen({ visible, error, onRetry }) {
	const show = visible || error;
	const handleRetry = onRetry || (() => window.location.reload());
	return (
		<div
			className={`loading-screen${show ? "" : " loading-screen-hidden"}`}
		>
			{error ? (
				<div className="loading-screen-error">
					<span className="loading-screen-error-icon">⚠️</span>
					<p>{error}</p>
					<button
						className="loading-screen-retry-btn"
						onClick={handleRetry}
					>
						Reintentar
					</button>
				</div>
			) : (
				<LoadingRing width={32} height={32} className="loading-ring" />
			)}
		</div>
	);
}
