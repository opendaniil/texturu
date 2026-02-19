import { videoExternalIdSchema } from "@tubebook/schemas"
import { z } from "zod"

const SCHEME_RE = /^[a-z][a-z0-9+.-]*:\/\//i
const URL_LIKE_RE = /^(https?:\/\/|www\.)/i

const YOUTUBE_HOSTS = new Set([
	"youtube.com",
	"www.youtube.com",
	"m.youtube.com",
	"music.youtube.com",
	"youtube-nocookie.com",
	"www.youtube-nocookie.com",
])

const YOUTUBE_SHORT_HOSTS = new Set(["youtu.be", "www.youtu.be"])

export const parseErrors = {
	INVALID_URL: "Не удалось распознать ссылку",
	NOT_YOUTUBE: "Ссылка не ведёт на YouTube",
	SHORTS_NOT_SUPPORTED: "Ссылки на Shorts не поддерживаются",
	PLAYLIST_NOT_SUPPORTED: "Ссылки на плейлисты не поддерживаются",
	MISSING_VIDEO_ID: "В ссылке не найден идентификатор видео",
	INVALID_VIDEO_ID: "Неверная ссылка на видео",
	UNKNOWN_YOUTUBE_URL: "Не удалось найти видео по этой ссылке",
} as const

type ParseError = (typeof parseErrors)[keyof typeof parseErrors]

type ParseResult =
	| { ok: true; videoId: string }
	| { ok: false; error: ParseError }

const ok = (videoId: string): ParseResult => ({ ok: true, videoId })
const fail = (error: ParseError): ParseResult => ({ ok: false, error })

/** YouTube video IDs never contain dots, so any dot implies a URL */
function looksLikeUrl(value: string): boolean {
	return URL_LIKE_RE.test(value) || value.includes(".")
}

function validateVideoId(value: string): ParseResult {
	return videoExternalIdSchema.safeParse(value).success
		? ok(value)
		: fail(parseErrors.INVALID_VIDEO_ID)
}

function safeDecodeURIComponent(value: string): string {
	try {
		return decodeURIComponent(value)
	} catch {
		return value
	}
}

function extractPathVideoId(pathname: string): string | null {
	const match = pathname.match(/^\/(embed|v|live|podcast)\/([^/]+)\/?$/i)
	return match?.[2] ? safeDecodeURIComponent(match[2]) : null
}

function makeUrl(input: string): URL | null {
	const hasScheme = SCHEME_RE.test(input)
	try {
		if (!hasScheme && input.startsWith("//")) {
			return new URL(`https:${input}`)
		}
		return new URL(hasScheme ? input : `https://${input}`)
	} catch {
		return null
	}
}

export function parseYouTubeInput(input: string): ParseResult {
	const trimmedInput = input.trim()

	if (!looksLikeUrl(trimmedInput)) {
		return validateVideoId(trimmedInput)
	}

	const hasScheme = SCHEME_RE.test(trimmedInput)
	const url = makeUrl(trimmedInput)
	if (!url) return fail(parseErrors.INVALID_URL)

	const { pathname, protocol, searchParams } = url
	const hostname = url.hostname.toLowerCase()

	const isShortUrl = YOUTUBE_SHORT_HOSTS.has(hostname)
	const isYouTube = YOUTUBE_HOSTS.has(hostname)

	if (!isShortUrl && !isYouTube) {
		return fail(parseErrors.NOT_YOUTUBE)
	}

	if (hasScheme && protocol !== "https:" && protocol !== "http:") {
		return fail(parseErrors.INVALID_URL)
	}

	if (url.username || url.password) {
		return fail(parseErrors.INVALID_URL)
	}

	// youtu.be/VIDEO_ID
	if (isShortUrl) {
		const match = pathname.match(/^\/([^/]+)\/?$/)
		if (!match) return fail(parseErrors.MISSING_VIDEO_ID)
		return validateVideoId(safeDecodeURIComponent(match[1]))
	}

	// /shorts/* → reject explicitly
	if (/^\/shorts(\/|$)/i.test(pathname)) {
		return fail(parseErrors.SHORTS_NOT_SUPPORTED)
	}

	// /playlist → reject explicitly
	if (/^\/playlist\/?$/i.test(pathname)) {
		return fail(parseErrors.PLAYLIST_NOT_SUPPORTED)
	}

	// /watch?v=VIDEO_ID
	if (/^\/watch\/?$/i.test(pathname)) {
		const videoId = searchParams.get("v")
		if (!videoId) return fail(parseErrors.MISSING_VIDEO_ID)

		const normalizedVideoId = videoId.trim()
		if (!normalizedVideoId) return fail(parseErrors.MISSING_VIDEO_ID)

		return validateVideoId(normalizedVideoId)
	}

	// /?v=VIDEO_ID
	if (/^\/$/i.test(pathname)) {
		const videoId = searchParams.get("v")
		if (videoId !== null) {
			const normalizedVideoId = videoId.trim()
			if (!normalizedVideoId) return fail(parseErrors.MISSING_VIDEO_ID)
			return validateVideoId(normalizedVideoId)
		}
	}

	// /embed/VIDEO_ID, /v/VIDEO_ID, /live/VIDEO_ID, /podcast/VIDEO_ID
	const videoId = extractPathVideoId(pathname)
	if (videoId) return validateVideoId(videoId)

	return fail(parseErrors.UNKNOWN_YOUTUBE_URL)
}

export const linkSchema = z
	.string()
	.trim()
	.transform((input, ctx) => {
		const result = parseYouTubeInput(input)

		if (result.ok) return result.videoId

		ctx.addIssue({ code: "custom", message: result.error })
		return z.NEVER
	})
