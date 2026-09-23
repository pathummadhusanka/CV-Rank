import { useState } from "react";

import { Button } from "@/components/ui/button"


export default function HomePage() {
	const [count, setCount] = useState(0);
	return (
		<main>
			<h1>Home</h1>
			<p className="bg-green-500">Welcome to the home page.</p>

			<div className="mt-10 flex flex-row gap-4">
				<span>Count is: {count}</span>
				<Button onClick={() => setCount(count + 1)}>Click me {count}</Button>
			</div>
		</main>
	);
}
