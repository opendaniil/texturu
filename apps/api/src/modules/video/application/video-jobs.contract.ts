export const QUEUES = {
	FETCHING_INFO: "fetch_info",
	FETCHING_CAPTIONS: "fetch_captions",
	GENERATE_ARTICLE: "generate_article",
} as const

export type FetchInfoJobData = {
	videoId: string
	externalId: string
}

export type FetchCaptionsJobData = {
	videoId: string
	externalId: string
}

export type GenerateArticleJobData = {
	videoId: string
}
