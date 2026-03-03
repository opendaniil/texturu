import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	output: "standalone",
	turbopack: {},
	productionBrowserSourceMaps: false,
	experimental: {
		serverSourceMaps: false,
		webpackMemoryOptimizations: true,
	},
}

export default nextConfig
