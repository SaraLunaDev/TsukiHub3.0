import React from "react";
import LoadingRing from "../../icons/LoadingRing";
import "./UserRanking.css";

const UserRanking = ({
	users,
	pokemonCount,
	selectedUser,
	handleUserClick,
	activeGenerations,
	pokemonList,
	GENERATION_RANGES,
	totalCharacters,
	className = "",
	onScroll,
	hasMore,
	loadingMore,
}) => {
	const getCount = (user) => {
		if (user.pokemons !== undefined) return user.pokemons;
		if (user.personajes !== undefined) return user.personajes;
		if (pokemonCount) return pokemonCount.get(String(user.id)) || 0;
		return 0;
	};

	const sortedUsers = users.slice().sort((a, b) => {
		return getCount(b) - getCount(a);
	});

	const calculateUserPercentage = (user) => {
		if (totalCharacters != null) {
			const count = getCount(user);
			return totalCharacters > 0
				? Math.round((count / totalCharacters) * 100)
				: 0;
		}

		let captured = 0;
		let totalPossible = 0;

		if (!activeGenerations) return 0;
		activeGenerations.forEach((gen) => {
			const { start, end } = GENERATION_RANGES[gen];
			totalPossible += end - start + 1;

			captured += pokemonList.filter((p) => {
				const id = parseInt(p.pokemonId, 10);
				return id >= start && id <= end && p.Usuario === user.id;
			}).length;
		});

		return totalPossible > 0
			? ((captured / totalPossible) * 100).toFixed(0)
			: 0;
	};

	return (
		<div
			className={`normal-section user-ranking ${className}`}
			onScroll={onScroll}
		>
			<table className="user-ranking-table">
				<tbody>
					{sortedUsers.map((user, index) => {
						const count = getCount(user);
						const rank = index + 1;
						const percentage = calculateUserPercentage(user);
						return (
							<tr
								key={user.id}
								className={`user-ranking-item ${
									user.id === selectedUser ? "selected" : ""
								}`}
								onClick={() => handleUserClick(user.id)}
							>
								<td className="user-ranking-rank-cell">
									<span
										className={`user-ranking-rank user-ranking-rank-${rank}`}
									>
										#{rank}
									</span>
								</td>
								<td className="user-ranking-pfp-cell">
									<img
										src={user.pfp}
										alt={user.nombre}
										className="user-ranking-pfp"
									/>
								</td>
								<td className="user-ranking-name-cell">
									<span className="user-ranking-name">
										{user.nombre}
									</span>
								</td>
								<td className="user-ranking-count-cell">
									<span className="user-ranking-count">
										{count}
									</span>
								</td>
								<td className="user-ranking-percentage-cell">
									<span className="user-ranking-percentage">
										{percentage}%
									</span>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			{loadingMore && (
				<div
					style={{
						textAlign: "center",
						padding: 12,
						color: "var(--text-2)",
					}}
				>
					<LoadingRing width={20} height={20} />
				</div>
			)}
			{hasMore && !loadingMore && sortedUsers.length > 0 && (
				<div
					style={{
						textAlign: "center",
						padding: 12,
						color: "var(--text-2)",
						fontSize: 13,
					}}
				>
					Scroll para cargar más
				</div>
			)}
		</div>
	);
};

export default UserRanking;
