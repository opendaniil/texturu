import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useArticleHeadingComponents } from "../model/use-article-heading-components"

interface Props {
	content: string
}

export function ArticleContent({ content }: Props) {
	const components = useArticleHeadingComponents()

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
