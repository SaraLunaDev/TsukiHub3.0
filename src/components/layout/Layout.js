import Navbar from "./Navbar/Navbar";
import PullToRefresh from "../common/PullToRefresh/PullToRefresh";
import "./Layout.css";

function Layout({ children }) {
	return (
		<div className="layout">
			<Navbar />
			<main className="layout-content">
				<PullToRefresh>{children}</PullToRefresh>
			</main>
		</div>
	);
}

export default Layout;
