import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	turbopack: {},
	watchOptions: {
		pollIntervalMs: 500,
	},
}

export default nextConfig
