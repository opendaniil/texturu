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

	return (
		<Blogpost
			post={{
				title: article.title,
				description: article.article.slice(0, 100),
				pubDate: article.updatedAt,
				image:
					"https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg",
				authorName: "ChatGPT",
				authorImage:
					"https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-2.webp",
			}}
			article={article.article}
		/>
	)
}
