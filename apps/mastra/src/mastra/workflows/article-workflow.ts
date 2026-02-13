import { createStep, createWorkflow } from "@mastra/core/workflows"
import {
	articleWorkflowInputSchema,
	articleWorkflowOutputSchema,
} from "@tubebook/schemas"

const createArticle = createStep({
	id: "create-article",
	description: "Generates an article from subtitles",
	inputSchema: articleWorkflowInputSchema,
	outputSchema: articleWorkflowOutputSchema,
	execute: async ({ inputData, mastra }) => {
		const { subtitles } = inputData

		const agent = mastra?.getAgent("articleAgent")
		if (!agent) {
			throw new Error("Article agent not found")
		}

		const article = await agent.generate([
			{
				role: "user",
				content: `
				ОБРАБОТАЙ ЭТИ СУБТИТРЫ:
				${subtitles}
				`,
			},
		])

		const title = await agent.generate(
			[
				{
					role: "user",
					content: `
						Дай название для этой статьи:
						${article.text}
						`,
				},
			],
			{
				instructions: `
					Ты эксперт по созданию заголовков для статьи.
					Твоя задача — создать цепляющее название, ёмкое и краткое.
					Верни только сам заголовок без кавычек, markdown и пояснений.
					`,
			}
		)

		return {
			title: title.text.trim(),
			article: article.text.trim(),
		}
	},
})

const articleWorkflow = createWorkflow({
	id: "article-workflow",
	inputSchema: articleWorkflowInputSchema,
	outputSchema: articleWorkflowOutputSchema,
}).then(createArticle)

articleWorkflow.commit()

export { articleWorkflow }
