import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	output: "standalone",
	turbopack: {},
	productionBrowserSourceMaps: false,
	experimental: {
		serverSourceMaps: process.env.NODE_ENV === "development",
		webpackMemoryOptimizations: true,
	},
}

export default nextConfig
