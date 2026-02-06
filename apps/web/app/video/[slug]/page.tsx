import { VideoPage } from "@/pages/video"

export default async function Page({ params }: { params: { slug: string } }) {
	const { slug } = await params
	return <VideoPage params={{ slug }} />
}
