import { spawn } from "node:child_process"

export async function generateTypes() {
	console.log("[kysely-codegen] 🔄 Generating types...")

	const child = spawn("pnpm", ["run", "kysely:generate"], {
		stdio: "inherit",
		shell: process.platform === "win32",
	})

	const exitCode: number = await new Promise((resolve, reject) => {
		child.on("error", reject)
		child.on("close", resolve)
	})

	if (exitCode === 0) {
		console.log("[kysely-codegen] ✅ Types generated")
	} else {
		throw new Error("[kysely-codegen] ❌ Codegen failed")
	}
}
