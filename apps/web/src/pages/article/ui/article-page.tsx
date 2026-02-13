import { notFound } from "next/navigation"
import { Blogpost } from "@/shared/components/blogpost"
import { getArticle } from "../api"

export async function generateStaticParams() {
	return []
}

export default async function Page({ params }: { params: { slug: string } }) {
	const { slug } = await params
	const article = await getArticle(slug)

	if (!article) notFound()

	return <Blogpost article={article.article} />
}
