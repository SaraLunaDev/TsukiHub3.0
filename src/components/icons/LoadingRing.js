export default function LoadingRing({
	width = 48,
	height = 48,
	className,
	animated = true,
}) {
	const circleStyle = animated ? {} : { animation: "none" };
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={width}
			height={height}
			className={className}
			viewBox="0 0 24 24"
			style={{ overflow: "visible" }}
		>
			<style>
				{`
					.dot-left, .dot-right {
						animation: loading-pulse 0.75s ease-in-out infinite;
						transform-origin: 4px 12px;
					}
					.dot-right {
						transform-origin: 20px 12px;
					}
					.dot-center {
						animation: loading-pulse-center 0.75s ease-in-out infinite;
						transform-origin: 12px 12px;
					}
					@keyframes loading-pulse {
						0%, 100% { transform: scale(0.5); }
						50% { transform: scale(1); }
					}
					@keyframes loading-pulse-center {
						0%, 100% { transform: scale(1); }
						50% { transform: scale(0.5); }
					}
				`}
			</style>
			<circle
				cx="4"
				cy="12"
				r="3"
				fill="currentColor"
				className="dot-left"
				style={circleStyle}
			/>
			<circle
				cx="12"
				cy="12"
				r="3"
				fill="currentColor"
				className="dot-center"
				style={circleStyle}
			/>
			<circle
				cx="20"
				cy="12"
				r="3"
				fill="currentColor"
				className="dot-right"
				style={circleStyle}
			/>
		</svg>
	);
}
