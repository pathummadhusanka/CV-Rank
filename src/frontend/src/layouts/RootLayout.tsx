import { NavLink, Outlet } from "react-router";

export default function RootLayout() {
	return (
		<div className="app">
			<header className="header">
				<h2>My Application</h2>

				<nav className="navigation">
					<NavLink to="/">Home</NavLink>
					<NavLink to="/dashboard">Dashboard</NavLink>
				</nav>
			</header>

			<div className="content">
				<Outlet />
			</div>

			<footer className="footer">
				<p>My Application</p>
			</footer>
		</div>
	);
}
