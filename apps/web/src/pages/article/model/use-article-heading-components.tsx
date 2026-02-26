import { isValidElement, type ReactNode } from "react"
import type { Components } from "react-markdown"
import { cn } from "@/shared/lib/utils"

type SourceHeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
type TargetHeadingTag = "h2" | "h3" | "h4" | "h5" | "h6"
type HeadingComponent = NonNullable<Components["h1"]>

function extractText(node: ReactNode): string {
	if (typeof node === "string" || typeof node === "number") {
		return String(node)
	}

	if (Array.isArray(node)) {
		return node.map((item) => extractText(item)).join("")
	}

	if (isValidElement<{ children?: ReactNode }>(node)) {
		return extractText(node.props.children)
	}

	return ""
}

function createHeading(
	tag: TargetHeadingTag,
	getHeadingId: () => string
): HeadingComponent {
	return ({ node: _node, children, className, ...props }) => {
		const id = getHeadingId()
		const headingText = extractText(children).trim()
		const linkLabel = `Ссылка на раздел ${id}: ${headingText}`
		const Heading = tag

		return (
			<Heading
				id={id}
				className={cn("group relative scroll-mt-24", className)}
				{...props}
			>
				<a
					href={`#${id}`}
					aria-label={linkLabel}
					className="absolute right-full top-[0.2em] mr-2 text-muted-foreground leading-none no-underline opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100"
				>
					#
				</a>
				{children}
			</Heading>
		)
	}
}

const headingTagMap: Record<SourceHeadingTag, TargetHeadingTag> = {
	h1: "h2",
	h2: "h3",
	h3: "h4",
	h4: "h5",
	h5: "h6",
	h6: "h6",
}

export function useArticleHeadingComponents(): Components {
	let headingIndex = 0

	const getHeadingId = () => {
		headingIndex += 1
		return `${headingIndex}`
	}

	return {
		h1: createHeading(headingTagMap.h1, getHeadingId),
		h2: createHeading(headingTagMap.h2, getHeadingId),
		h3: createHeading(headingTagMap.h3, getHeadingId),
		h4: createHeading(headingTagMap.h4, getHeadingId),
		h5: createHeading(headingTagMap.h5, getHeadingId),
		h6: createHeading(headingTagMap.h6, getHeadingId),
	}
}
