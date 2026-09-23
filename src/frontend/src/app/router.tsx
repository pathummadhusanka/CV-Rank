import { createBrowserRouter } from "react-router";

import RootLayout from "../layouts/RootLayout";
import DashboardPage from "../pages/DashboardPage";
import HomePage from "../pages/HomePage";
import NotFoundPage from "../pages/NotFoundPage";

export const router = createBrowserRouter([
	{
		path: "/",
		Component: RootLayout,
		children: [
			{
				index: true,
				Component: HomePage,
			},
			{
				path: "dashboard",
				Component: DashboardPage,
			},
			{
				path: "*",
				Component: NotFoundPage,
			},
		],
	},
]);
