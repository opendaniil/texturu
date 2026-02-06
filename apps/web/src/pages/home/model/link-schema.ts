import { VIDEO_ID_RE } from "@tubebook/schemas"
import { z } from "zod"

const SCHEME_RE = /^[a-z][a-z0-9+.-]*:\/\//i
const URL_LIKE_RE = /^(https?:\/\/|www\.)/i

type ParseError = "Не YouTube-домен" | "Неверный формат YouTube-ссылки"

type ParseResult =
	| { ok: true; videoId: string }
	| { ok: false; error: ParseError }

const ok = (videoId: string): ParseResult => ({ ok: true, videoId })
const fail = (error: ParseError): ParseResult => ({ ok: false, error })

function looksLikeUrl(value: string): boolean {
	return URL_LIKE_RE.test(value) || value.includes(".")
}

function parseYouTubeInput(input: string): ParseResult {
	if (!looksLikeUrl(input)) {
		return VIDEO_ID_RE.test(input)
			? ok(input)
			: fail("Неверный формат YouTube-ссылки")
	}

	const hasScheme = SCHEME_RE.test(input)

	let url: URL
	try {
		url = new URL(hasScheme ? input : `https://${input}`)
	} catch {
		return fail("Неверный формат YouTube-ссылки")
	}

	const { hostname, pathname, protocol, searchParams } = url
	const isShortUrl = hostname === "youtu.be"
	const isFullUrl = hostname === "www.youtube.com"

	if (!isShortUrl && !isFullUrl) {
		return fail(
			URL_LIKE_RE.test(input)
				? "Не YouTube-домен"
				: "Неверный формат YouTube-ссылки"
		)
	}

	if (hasScheme && protocol !== "https:") {
		return fail("Неверный формат YouTube-ссылки")
	}

	if (isShortUrl) {
		if (!hasScheme) return fail("Неверный формат YouTube-ссылки")

		const match = pathname.match(/^\/([^/]+)\/?$/)
		if (!match) return fail("Неверный формат YouTube-ссылки")

		return VIDEO_ID_RE.test(match[1])
			? ok(match[1])
			: fail("Неверный формат YouTube-ссылки")
	}

	if (pathname !== "/watch") return fail("Неверный формат YouTube-ссылки")

	const videoId = searchParams.get("v")
	if (!videoId) return fail("Неверный формат YouTube-ссылки")

	return VIDEO_ID_RE.test(videoId)
		? ok(videoId)
		: fail("Неверный формат YouTube-ссылки")
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
