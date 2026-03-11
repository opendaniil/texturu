import { revalidateTag } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
	const adminKey = request.headers.get("x-admin-key")

	if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 })
	}

	const body = await request.json()
	const tags: string[] = body.tags

	if (!Array.isArray(tags)) {
		return NextResponse.json(
			{ error: "tags must be an array" },
			{ status: 400 }
		)
	}

	for (const tag of tags) {
		revalidateTag(tag, { expire: 0 })
	}

	return NextResponse.json({ revalidated: true })
}
