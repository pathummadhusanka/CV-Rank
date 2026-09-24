import { createBrowserRouter } from "react-router";

import RootLayout from "../layouts/RootLayout";
import DashboardPage from "../pages/DashboardPage";
import HomePage from "../pages/HomePage";
import JobsPage from "../pages/JobsPage";
import CVLibraryPage from "../pages/CVLibraryPage";
import NotFoundPage from "../pages/NotFoundPage";
import DeveloperOptionsPage from "../pages/DeveloperOptionsPage";

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
				path: "jobs",
				Component: JobsPage,
			},
			{
				path: "cvs",
				Component: CVLibraryPage,
			},
			{
				path: "dashboard",
				Component: DashboardPage,
			},
			{
				path: "developer-options",
				Component: DeveloperOptionsPage,
			},
			{
				path: "*",
				Component: NotFoundPage,
			},
		],
	},
]);
