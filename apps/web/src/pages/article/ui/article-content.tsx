import { evaluate } from "@mdx-js/mdx"
import * as runtime from "react/jsx-runtime"
import remarkGfm from "remark-gfm"

const components = {} as const

interface Props {
	content: string
}

export async function ArticleContent({ content }: Props) {
	const { default: MdxContent } = await evaluate(content, {
		...runtime,
		remarkPlugins: [remarkGfm],
	})

	return (
		<div className="prose dark:prose-invert max-w-none">
			<MdxContent components={components} />
		</div>
	)
}
