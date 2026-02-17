import { evaluate } from "@mdx-js/mdx"
import { format } from "date-fns"
import { Lightbulb } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import * as runtime from "react/jsx-runtime"
import remarkGfm from "remark-gfm"
import { cn } from "@/shared/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"

const defaultPost = {
	title: "Designing websites faster with shadcn/ui",
	authorName: "John Doe",
	image:
		"https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg",
	pubDate: new Date(),
	description:
		"A step-by-step guide to building a modern, responsive blog using React and Tailwind CSS.",
	authorImage:
		"https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-2.webp",
}

interface BlogPostData {
	title: string
	authorName: string
	image: string
	pubDate: Date
	description: string
	authorImage: string
}

interface BlogpostProps {
	className?: string
	post?: BlogPostData
	article: string
}

const components = {} as const

export const Blogpost = async ({
	post = defaultPost,
	article,
	className,
}: BlogpostProps) => {
	const { title, authorName, image, pubDate, description, authorImage } = post

	const { default: MdxContent } = await evaluate(article, {
		...runtime,
		remarkPlugins: [remarkGfm],
	})

	return (
		<section className={cn("py-32", className)}>
			<div className="container">
				<div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center">
					<h1 className="max-w-3xl text-5xl font-semibold text-pretty md:text-6xl">
						{title}
					</h1>
					<h3 className="max-w-3xl text-lg text-muted-foreground md:text-xl">
						{description}
					</h3>
					<div className="flex items-center gap-3 text-sm md:text-base">
						<Avatar className="h-8 w-8 border">
							<AvatarImage src={authorImage} />
							<AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
						</Avatar>
						<span>
							<Link href="#" className="font-semibold">
								{authorName}
							</Link>
							<span className="ml-1">on {format(pubDate, "MMMM d, yyyy")}</span>
						</span>
					</div>
					<Image
						width={1280}
						height={720}
						src={image}
						alt="placeholder"
						className="mt-4 mb-8 aspect-video w-full rounded-lg border object-cover"
					/>
				</div>
			</div>

			<div className="container">
				<div className="mx-auto prose max-w-3xl dark:prose-invert">
					<MdxContent components={components} />

					<Alert>
						<Lightbulb className="h-4 w-4" />
						<AlertTitle>Royal Decree!</AlertTitle>
						<AlertDescription>
							Remember, all jokes must be registered at the Royal Jest Office
							before telling them
						</AlertDescription>
					</Alert>
				</div>
			</div>

			<div className="prose dark:prose-invert"></div>
		</section>
	)
}
