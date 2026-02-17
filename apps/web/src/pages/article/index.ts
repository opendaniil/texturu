import ArticlePage, { generateMetadata } from "./ui/article-page"

type PageProps = {
	params: Promise<{ slug: string }>
}

export default async function Page({ params }: PageProps) {
	const { slug } = await params

	return ArticlePage({ slug })
}

export { ArticlePage, generateMetadata }
