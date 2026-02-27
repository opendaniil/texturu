import type { ArticleSection } from "@tubebook/schemas"
import type { Heading, PhrasingContent, Root, RootContent } from "mdast"
import { remark } from "remark"

function headingText(node: Heading): string {
	const out: string[] = []

	function walk(cur: PhrasingContent | PhrasingContent[] | undefined): void {
		if (!cur) return
		if (Array.isArray(cur)) return void cur.forEach(walk)

		if ((cur.type === "text" || cur.type === "inlineCode") && "value" in cur) {
			out.push(String(cur.value))
		}

		if ("children" in cur) walk(cur.children)
	}

	walk(node.children)
	return out.join("").trim()
}

export function extractSectionsFromArticle(article: string): ArticleSection[] {
	const source = article.trim()
	if (!source) throw new Error("Article markdown is empty")

	const md = remark()
	const tree = md.parse(source) as Root

	const sections: Array<{ title: string; nodes: RootContent[] }> = []
	let current: { title: string; nodes: RootContent[] } | null = null

	for (const node of tree.children) {
		if (node.type === "heading" && node.depth === 2) {
			if (current) sections.push(current)
			current = { title: headingText(node), nodes: [] }
			continue
		}
		if (current) current.nodes.push(node)
	}

	if (current) sections.push(current)

	return sections.map((s, index) => ({
		number: index + 1,
		title: s.title,
		content: md.stringify({ type: "root", children: s.nodes }).trim(),
	}))
}
