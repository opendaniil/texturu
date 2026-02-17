import { ArrowUpRight } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"

interface HeroProps {
	badge?: string
	heading?: string
	description?: string
	image?: {
		src: string
		alt: string
	}
	className?: string
	children?: React.ReactNode
}

export const Hero = ({
	badge = "Your Website Builder",
	heading = "Blocks Built With Shadcn & Tailwind",
	description = "Finely crafted components built with React, Tailwind and Shadcn UI. Developers can copy and paste these blocks directly into their project.",
	image = {
		src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg",
		alt: "Hero section demo image showing interface components",
	},
	className,
	children,
}: HeroProps) => {
	return (
		<section className={cn("py-32", className)}>
			<div className="container">
				<div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
					<div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
						{badge && (
							<Badge variant="outline">
								{badge}
								<ArrowUpRight className="ml-2 size-4" />
							</Badge>
						)}
						<h1 className="text-4xl font-bold text-pretty lg:text-6xl">
							{heading}
						</h1>
						<p className="max-w-xl text-muted-foreground lg:text-xl">
							{description}
						</p>
						<div className="flex w-full flex-col justify-center gap-2 sm:flex-row lg:justify-start">
							{children}
						</div>
					</div>
					<img
						src={image.src}
						alt={image.alt}
						className="aspect-video w-full rounded-md object-cover"
					/>
				</div>
			</div>
		</section>
	)
}
