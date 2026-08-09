import { useState, useRef, useCallback } from "react";
import { useRefreshContext } from "../../../hooks/useRefresh";
import LoadingRing from "../../icons/LoadingRing";
import "./PullToRefresh.css";

const THRESHOLD = 60;
const MAX_PULL = 120;
const DAMPING = 0.4;
const REFRESH_HOLD_MS = 900;

export default function PullToRefresh({ children }) {
	const { triggerRefresh } = useRefreshContext();
	const [pullDistance, setPullDistance] = useState(0);
	const [phase, setPhase] = useState("idle");
	const pullingRef = useRef(false);
	const startYRef = useRef(null);
	const distanceRef = useRef(0);

	const isPullingActive = phase !== "idle" && phase !== "refreshing";

	const handleTouchStart = useCallback(
		(e) => {
			if (phase === "refreshing") return;
			if (window.scrollY > 0) return;
			startYRef.current = e.touches[0].clientY;
			pullingRef.current = false;
		},
		[phase],
	);

	const handleTouchMove = useCallback(
		(e) => {
			if (startYRef.current === null) return;
			if (phase === "refreshing") return;

			const deltaY = e.touches[0].clientY - startYRef.current;

			if (!pullingRef.current) {
				if (deltaY < 10) return;
				if (window.scrollY > 0) {
					startYRef.current = null;
					return;
				}
				pullingRef.current = true;
			}

			if (deltaY <= 0) {
				distanceRef.current = 0;
				setPullDistance(0);
				setPhase("idle");
				startYRef.current = null;
				pullingRef.current = false;
				return;
			}

			e.preventDefault();

			const distance = Math.min(deltaY * DAMPING, MAX_PULL);
			distanceRef.current = distance;
			setPullDistance(distance);
			setPhase(distance > THRESHOLD ? "ready" : "pulling");
		},
		[phase],
	);

	const handleTouchEnd = useCallback(() => {
		if (!pullingRef.current) return;
		pullingRef.current = false;
		startYRef.current = null;

		if (distanceRef.current > THRESHOLD) {
			setPhase("refreshing");
			setPullDistance(THRESHOLD);
			triggerRefresh();
			setTimeout(() => {
				setPullDistance(0);
				setTimeout(() => {
					setPhase("idle");
				}, 300);
			}, REFRESH_HOLD_MS);
		} else {
			setPullDistance(0);
			setTimeout(() => setPhase("idle"), 300);
		}
	}, [triggerRefresh]);

	const indicatorHeight = Math.min(pullDistance, THRESHOLD);

	return (
		<div
			className="pull-to-refresh"
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
		>
			<div
				className={`pull-indicator${phase !== "idle" ? " visible" : ""}${phase === "refreshing" ? " refreshing" : ""}`}
				style={{
					height: `${indicatorHeight}px`,
					opacity:
						indicatorHeight > 0
							? Math.min(indicatorHeight / THRESHOLD, 1)
							: 0,
				}}
			>
				<LoadingRing
					width={24}
					height={24}
					animated={phase === "refreshing"}
				/>
			</div>

			<div
				className="pull-content"
				style={{
					...(pullDistance > 0 || phase !== "idle"
						? { transform: `translateY(${pullDistance}px)` }
						: {}),
					transition: isPullingActive
						? "none"
						: "transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
					willChange: isPullingActive ? "transform" : "auto",
				}}
			>
				{children}
			</div>
		</div>
	);
}
