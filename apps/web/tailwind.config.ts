import typography from "@tailwindcss/typography"
import type { Config } from "tailwindcss"

export default {
	content: [
		"./app/**/*.{js,ts,jsx,tsx,md,mdx}",
		"./src/**/*.{js,ts,jsx,tsx,md,mdx}",
	],
	plugins: [typography],
} satisfies Config
