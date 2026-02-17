import { notFound } from "next/navigation"
import { getArticle } from "../api"
import { Blogpost } from "./blogpost"

export default async function ArticlePage({ slug }: { slug: string }) {
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
