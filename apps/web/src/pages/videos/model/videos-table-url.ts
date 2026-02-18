import {
	type ListVideosQuery,
	listVideosQuerySchema,
	listVideosSortBySchema,
	videoSchema,
} from "@tubebook/schemas"
import {
	createLoader,
	createParser,
	createSerializer,
	type inferParserType,
	parseAsString,
	parseAsStringEnum,
	type UrlKeys,
} from "nuqs/server"

type SearchParamValue = string | string[] | undefined

export type VideosSearchParamsInput =
	| Record<string, SearchParamValue>
	| null
	| undefined

const defaultQuery = listVideosQuerySchema.parse({})

// URL contract used by nuqs in client-side hooks.
const parseAsPageIndex = createParser<number>({
	parse: (value) => {
		const raw = Number(value)
		if (!Number.isSafeInteger(raw) || raw < 1) return null
		return raw - 1
	},
	serialize: (value) => String(value + 1),
})

const parseAsPageSize = createParser<number>({
	parse: (value) => {
		const parsed = listVideosQuerySchema.shape.pageSize.safeParse(value)
		return parsed.success ? parsed.data : null
	},
	serialize: (value) => String(value),
})

export const videosTableNuqsParsers = {
	pageIndex: parseAsPageIndex.withDefault(defaultQuery.pageIndex),
	pageSize: parseAsPageSize.withDefault(defaultQuery.pageSize),
	sortBy: parseAsStringEnum(listVideosSortBySchema.options).withDefault(
		defaultQuery.sortBy
	),
	sortDir: parseAsStringEnum(["asc", "desc"] as const).withDefault(
		defaultQuery.sortDir
	),
	status: parseAsStringEnum(videoSchema.shape.status.options),
	q: parseAsString,
}

export const videosTableNuqsUrlKeys: UrlKeys<typeof videosTableNuqsParsers> = {
	pageIndex: "page",
}

const loadVideosTableQuery = createLoader(videosTableNuqsParsers, {
	urlKeys: videosTableNuqsUrlKeys,
})

const serializeVideosTableQuery = createSerializer(videosTableNuqsParsers, {
	urlKeys: videosTableNuqsUrlKeys,
})

export type VideosTableNuqsState = inferParserType<
	typeof videosTableNuqsParsers
>

export function buildQueryFromNuqsState(
	state: VideosTableNuqsState
): ListVideosQuery {
	const normalizedQuery = state.q?.trim()

	return {
		pageIndex: state.pageIndex ?? defaultQuery.pageIndex,
		pageSize: state.pageSize ?? defaultQuery.pageSize,
		sortBy: state.sortBy ?? defaultQuery.sortBy,
		sortDir: state.sortDir ?? defaultQuery.sortDir,
		...(state.status ? { status: state.status } : {}),
		...(normalizedQuery ? { q: normalizedQuery } : {}),
	}
}

export function buildNuqsPatchFromQuery(
	query: ListVideosQuery
): Partial<VideosTableNuqsState> {
	return {
		...query,
		status: query.status ?? null,
		q: query.q ?? null,
	}
}

export function parseVideosUrlSearchParams(
	input: VideosSearchParamsInput
): ListVideosQuery {
	const state = loadVideosTableQuery(input ?? {})

	return buildQueryFromNuqsState(state)
}

export function toVideosUrlSearchParams(
	query: ListVideosQuery
): URLSearchParams {
	const serialized = serializeVideosTableQuery(buildNuqsPatchFromQuery(query))
	return new URLSearchParams(serialized)
}
