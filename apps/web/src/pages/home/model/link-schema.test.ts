// node --test apps/web/src/pages/home/model/link-schema.test.ts

import assert from "node:assert/strict"
import test from "node:test"
// @ts-expect-error нужно расширение файла для тестов
import { linkSchema, parseErrors } from "./link-schema.ts"

const VALID_ID_A = "UEQSkaqrMZA"
const VALID_ID_B = "wwQDYSVAwXs"

type SuccessCase = {
	name: string
	input: string
	expected: string
}

type ErrorCase = {
	name: string
	input: string
	expected: (typeof parseErrors)[keyof typeof parseErrors]
}

const successCases: SuccessCase[] = [
	{
		name: "raw video id with trim returns id",
		input: `  ${VALID_ID_A}  `,
		expected: VALID_ID_A,
	},
	{
		name: "youtu.be link with trim returns id",
		input: `  https://youtu.be/${VALID_ID_B}  `,
		expected: VALID_ID_B,
	},
	{
		name: "watch link without scheme returns id",
		input: `youtube.com/watch?v=${VALID_ID_A}&t=90`,
		expected: VALID_ID_A,
	},
	{
		name: "scheme-relative watch link returns id",
		input: `//youtube.com/watch?v=${VALID_ID_A}`,
		expected: VALID_ID_A,
	},
	{
		name: "short link without scheme returns id",
		input: `youtu.be/${VALID_ID_A}`,
		expected: VALID_ID_A,
	},
	{
		name: "www watch link without scheme returns id",
		input: `www.youtube.com/watch?v=${VALID_ID_A}`,
		expected: VALID_ID_A,
	},
	{
		name: "embed link returns id",
		input: `https://www.youtube.com/embed/${VALID_ID_A}`,
		expected: VALID_ID_A,
	},
	{
		name: "m.youtube host returns id",
		input: `https://m.youtube.com/watch?v=${VALID_ID_A}`,
		expected: VALID_ID_A,
	},
	{
		name: "youtube-nocookie host returns id",
		input: `https://youtube-nocookie.com/embed/${VALID_ID_A}`,
		expected: VALID_ID_A,
	},
	{
		name: "root v param returns id",
		input: `https://youtube.com/?v=${VALID_ID_A}`,
		expected: VALID_ID_A,
	},
	{
		name: "watch with list returns id",
		input: `https://youtube.com/watch?v=${VALID_ID_A}&list=PL123`,
		expected: VALID_ID_A,
	},
	{
		name: "short link with list returns id",
		input: `https://youtu.be/${VALID_ID_A}?list=PL123`,
		expected: VALID_ID_A,
	},
	{
		name: "root v with list returns id",
		input: `https://youtube.com/?v=${VALID_ID_A}&list=PL123`,
		expected: VALID_ID_A,
	},
	{
		name: "v link returns id",
		input: `https://www.youtube.com/v/${VALID_ID_A}`,
		expected: VALID_ID_A,
	},
	{
		name: "live link returns id",
		input: `https://www.youtube.com/live/${VALID_ID_A}`,
		expected: VALID_ID_A,
	},
	{
		name: "podcast link returns id",
		input: `https://music.youtube.com/podcast/${VALID_ID_B}`,
		expected: VALID_ID_B,
	},
]

const errorCases: ErrorCase[] = [
	{
		name: "ftp scheme returns INVALID_URL",
		input: `ftp://youtube.com/watch?v=${VALID_ID_A}`,
		expected: parseErrors.INVALID_URL,
	},
	{
		name: "malformed url-like input returns INVALID_URL",
		input: "http://",
		expected: parseErrors.INVALID_URL,
	},
	{
		name: "unsupported scheme with youtube host returns INVALID_URL",
		input: `chrome-extension://youtube.com/watch?v=${VALID_ID_A}`,
		expected: parseErrors.INVALID_URL,
	},
	{
		name: "non-youtube domain returns NOT_YOUTUBE",
		input: `notyoutube.com/watch?v=${VALID_ID_A}`,
		expected: parseErrors.NOT_YOUTUBE,
	},
	{
		name: "spoofed youtube domain returns NOT_YOUTUBE",
		input: `https://youtube.com.evil.com/watch?v=${VALID_ID_A}`,
		expected: parseErrors.NOT_YOUTUBE,
	},
	{
		name: "shorts path returns SHORTS_NOT_SUPPORTED",
		input: `https://youtube.com/shorts/${VALID_ID_A}`,
		expected: parseErrors.SHORTS_NOT_SUPPORTED,
	},
	{
		name: "playlist path returns PLAYLIST_NOT_SUPPORTED",
		input: "https://youtube.com/playlist?list=PL123",
		expected: parseErrors.PLAYLIST_NOT_SUPPORTED,
	},
	{
		name: "short link without id returns MISSING_VIDEO_ID",
		input: "https://youtu.be/",
		expected: parseErrors.MISSING_VIDEO_ID,
	},
	{
		name: "watch without v returns MISSING_VIDEO_ID",
		input: "https://youtube.com/watch",
		expected: parseErrors.MISSING_VIDEO_ID,
	},
	{
		name: "watch with empty v returns MISSING_VIDEO_ID",
		input: "https://youtube.com/watch?v=",
		expected: parseErrors.MISSING_VIDEO_ID,
	},
	{
		name: "root with empty v returns MISSING_VIDEO_ID",
		input: "https://youtube.com/?v=",
		expected: parseErrors.MISSING_VIDEO_ID,
	},
	{
		name: "invalid raw video id returns INVALID_VIDEO_ID",
		input: "abc",
		expected: parseErrors.INVALID_VIDEO_ID,
	},
	{
		name: "watch with invalid v returns INVALID_VIDEO_ID",
		input: "https://youtube.com/watch?v=abc",
		expected: parseErrors.INVALID_VIDEO_ID,
	},
	{
		name: "embed without id returns UNKNOWN_YOUTUBE_URL",
		input: "https://youtube.com/embed/",
		expected: parseErrors.UNKNOWN_YOUTUBE_URL,
	},
	{
		name: "embed with extra segment returns UNKNOWN_YOUTUBE_URL",
		input: `https://youtube.com/embed/${VALID_ID_A}/extra`,
		expected: parseErrors.UNKNOWN_YOUTUBE_URL,
	},
	{
		name: "attribution_link with nested watch returns UNKNOWN_YOUTUBE_URL",
		input: `https://www.youtube.com/attribution_link?u=%2Fwatch%3Fv%3D${VALID_ID_A}%26feature%3Dshare`,
		expected: parseErrors.UNKNOWN_YOUTUBE_URL,
	},
	{
		name: "attribution_link without u returns UNKNOWN_YOUTUBE_URL",
		input: "https://youtube.com/attribution_link",
		expected: parseErrors.UNKNOWN_YOUTUBE_URL,
	},
	{
		name: "unknown youtube path returns UNKNOWN_YOUTUBE_URL",
		input: "https://youtube.com/channel/UC123",
		expected: parseErrors.UNKNOWN_YOUTUBE_URL,
	},
	{
		name: "credentials in url returns INVALID_URL",
		input: `https://user:pass@youtube.com/watch?v=${VALID_ID_A}`,
		expected: parseErrors.INVALID_URL,
	},
]

test("linkSchema", async (t) => {
	await t.test("success table", async (t) => {
		for (const item of successCases) {
			await t.test(item.name, () => {
				const parsed = linkSchema.safeParse(item.input)
				assert.equal(parsed.success, true)
				if (!parsed.success) return

				assert.equal(typeof parsed.data, "string")
				assert.equal(parsed.data, item.expected)
			})
		}
	})

	await t.test("error table", async (t) => {
		for (const item of errorCases) {
			await t.test(item.name, () => {
				const parsed = linkSchema.safeParse(item.input)
				assert.equal(parsed.success, false)
				if (parsed.success) return

				assert.ok(parsed.error.issues.length >= 1)
				assert.equal(parsed.error.issues[0]?.code, "custom")
				assert.equal(parsed.error.issues[0]?.message, item.expected)
			})
		}
	})

	await t.test("parse returns a video id string on success", () => {
		const value = linkSchema.parse(` https://youtu.be/${VALID_ID_B} `)
		assert.equal(typeof value, "string")
		assert.equal(value, VALID_ID_B)
	})
})
