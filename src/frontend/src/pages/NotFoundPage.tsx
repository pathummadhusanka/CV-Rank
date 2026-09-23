import { Link } from "react-router";

export default function NotFoundPage() {
	return (
		<main>
			<h1>404</h1>
			<p className="bg-red-500">The requested page was not found.</p>

			<Link to="/">Return home</Link>
		</main>
	);
}
