import { format, parse } from "date-fns"
import { ru } from "date-fns/locale"
import { Lightbulb } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { Badge } from "@/shared/ui/badge"
import { container } from "@/shared/ui/container"
import { getArticle } from "../api/get-article"
import { ArticleBotDrawer } from "./article-bot-drawer"
import { ArticleContent } from "./article-content"

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>
}): Promise<Metadata> {
	const { slug } = await params
	const article = await getArticle(slug)

	if (!article) return { title: "Не найдено" }

	return {
		title: article.title,
		description: article.description,
		openGraph: {
			title: article.title,
			description: article.description,
			type: "article",
		},
		twitter: {
			card: "summary_large_image",
			title: article.title,
			description: article.description,
		},
	}
}

type PageProps = {
	params: Promise<{ slug: string }>
}

export async function ArticlePage({ params }: PageProps) {
	const { slug } = await params
	const article = await getArticle(slug)

	if (!article) return notFound()

	const { id, title, description, createdAt, info, externalId, globalSummary } =
		article

	const authorName = info.channelTitle
	const authorLink = `https://www.youtube.com/channel/${info.channelId}`
	const authorVideoEmbed = `https://www.youtube-nocookie.com/embed/${externalId}?rel=0`

	const parsedUploadDate = parse(info.uploadDate, "yyyyMMdd", new Date())
	const formatedUploadDate = format(parsedUploadDate, "d MMMM yyyy", {
		locale: ru,
	})
	const authorImage =
		"https://upload.wikimedia.org/wikipedia/commons/f/fd/YouTube_full-color_icon_(2024).svg"

	const llmName = "GPT"
	const formatedCreatedAt = format(createdAt, "d MMMM yyyy", { locale: ru })
	const llmImage =
		"https://upload.wikimedia.org/wikipedia/commons/e/ef/ChatGPT-Logo.svg"
	const infoTags = Array.from(new Set([...info.categories, ...info.tags]))

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Article",
		headline: title,
		description,
		image: info.thumbnail,
		datePublished: parsedUploadDate.toISOString(),
		dateModified: new Date(createdAt).toISOString(),
		author: {
			"@type": "Person",
			name: authorName,
			url: authorLink,
		},
		publisher: {
			"@type": "Organization",
			name: "Textu.ru",
			url: "https://textu.ru",
		},
	}

	return (
		<main className="min-h-dvh">
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: needed for jsonLd
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<section className="py-12 sm:py-16">
				<div
					className={`${container.narrow} flex flex-col items-center gap-4 text-center`}
				>
					<h1 className="text-5xl font-semibold text-pretty md:text-6xl whitespace-normal  [overflow-wrap:anywhere]">
						{title}
					</h1>

					<h3 className="text-lg text-muted-foreground md:text-xl whitespace-normal break-words">
						{description}
					</h3>

					<div className="flex items-center gap-3 text-sm md:text-base">
						<Avatar className="h-8 w-8 border">
							<AvatarImage src={llmImage} />
							<AvatarFallback>{llmName.charAt(0)}</AvatarFallback>
						</Avatar>

						<span>
							{llmName}
							<span className="ml-1">создал статью {formatedCreatedAt}</span>
						</span>
					</div>

					<div className="flex items-center gap-3 text-sm md:text-base">
						<Avatar className="h-8 w-8 border">
							<AvatarImage src={authorImage} />
							<AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
						</Avatar>

						<span>
							{authorLink ? (
								<Link href={authorLink} className="font-semibold">
									{authorName}
								</Link>
							) : (
								<span className="font-semibold">{authorName}</span>
							)}

							<span className="ml-1">загрузил видео {formatedUploadDate}</span>
						</span>
					</div>

					<div className="aspect-video w-full overflow-hidden rounded-xl border shadow-xs">
						<iframe
							className="h-full min-w-full min-h-[200px]"
							src={authorVideoEmbed}
							title={info.fulltitle}
							allowFullScreen
						/>
					</div>
				</div>

				<div className={`${container.reading} flex flex-col gap-4 mt-4`}>
					<Alert>
						<Lightbulb className="h-4 w-4" />
						<AlertTitle>Внимание</AlertTitle>
						<AlertDescription>
							Эта статья сгенерирована на основе субтитров видео, возможны
							ошибки
						</AlertDescription>
					</Alert>

					<p className="text-muted-foreground text-sm">{globalSummary}</p>

					<ArticleContent content={article.article} />

					{infoTags.length > 0 ? (
						<div className="flex flex-wrap justify-center gap-2">
							{infoTags.map((tag) => (
								<Badge key={tag} variant="outline">
									{tag}
								</Badge>
							))}
						</div>
					) : null}
				</div>
			</section>

			<ArticleBotDrawer articleId={id} />
		</main>
	)
}
