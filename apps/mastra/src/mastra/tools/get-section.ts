import { createTool } from "@mastra/core/tools"
import {
	type ArticleSection,
	articleSectionSchema,
	chatRequestContextSchema,
} from "@texturu/schemas"
import z from "zod"
import { postgres } from "../store/pg"

export const getSectionTool = createTool({
	id: "get-section",
	description:
		"Возвращает секцию статьи по номеру из ARTICLE_TOC. Используй, когда нужен конкретный раздел статьи.",
	inputSchema: z.object({ sectionNumber: z.number().int().positive() }),
	outputSchema: z.object({ section: articleSectionSchema.nullable() }),
	requestContextSchema: chatRequestContextSchema,
	execute: async ({ sectionNumber }, context) => {
		const articleId = context.requestContext?.get("articleId")
		if (!articleId) return { section: null }

		const result = await postgres.pool.query<{
			section: ArticleSection | null
		}>(
			`
			SELECT
				(SELECT elem
				 FROM jsonb_array_elements(sections) AS elem
				 WHERE (elem->>'number')::int = $2
				 LIMIT 1) AS section
			FROM video_articles
			WHERE id = $1
			LIMIT 1
			`,
			[articleId, sectionNumber]
		)

		return { section: result.rows[0]?.section ?? null }
	},
})
