import { Status } from "./status"

export default async function Page({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	return <Status slug={slug} />
}
