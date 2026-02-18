import {
	parseVideosUrlSearchParams,
	VideosPage,
	type VideosSearchParamsInput,
} from "@/pages/videos"

export { metadata } from "@/pages/videos"

type PageProps = {
	searchParams: Promise<VideosSearchParamsInput>
}

export default async function Page({ searchParams }: PageProps) {
	const initialQuery = parseVideosUrlSearchParams(await searchParams)

	return <VideosPage initialQuery={initialQuery} />
}
