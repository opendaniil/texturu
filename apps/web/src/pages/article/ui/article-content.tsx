import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const components = {} as const

interface Props {
	content: string
}

export function ArticleContent({ content }: Props) {
	return (
		<div className="prose dark:prose-invert max-w-none">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				skipHtml
				components={components}
			>
				{content}
			</ReactMarkdown>
		</div>
	)
}
