import { StatusPage } from "@/pages/status"

export default async function Page({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params

	return <StatusPage slug={slug} />
}
