import { type VideoInfoPayload } from "@tubebook/schemas"
import { type VideoInfo } from "ytdlp-nodejs"

const normalizeNullableString = (value: unknown): string | null => {
	if (typeof value !== "string") {
		return null
	}

	const normalized = value.trim()
	return normalized.length > 0 ? normalized : null
}

const normalizeDuration = (value: unknown): number | null => {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return null
	}

	const normalized = Math.trunc(value)
	return normalized >= 0 ? normalized : null
}

const normalizeStringArray = (value: unknown): string[] => {
	if (!Array.isArray(value)) {
		return []
	}

	const normalized = value
		.map((item) => (typeof item === "string" ? item.trim() : ""))
		.filter((item) => item.length > 0)

	return Array.from(new Set(normalized))
}

export const normalizeVideoInfoPayload = (
	info: Partial<VideoInfo>
): VideoInfoPayload => ({
	fulltitle: normalizeNullableString(info.fulltitle),
	description: normalizeNullableString(info.description),
	channelId: normalizeNullableString(info.channel_id),
	channelTitle: normalizeNullableString(info.channel),
	duration: normalizeDuration(info.duration),
	categories: normalizeStringArray(info.categories),
	tags: normalizeStringArray(info.tags),
	language: normalizeNullableString(info.language),
})
