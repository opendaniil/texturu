import { Mastra } from "@mastra/core/mastra"
import { LibSQLStore } from "@mastra/libsql"
import { PinoLogger } from "@mastra/loggers"
import { Memory } from "@mastra/memory"
import {
	CloudExporter,
	DefaultExporter,
	Observability,
	SensitiveDataFilter,
} from "@mastra/observability"
import { articleAgent } from "./agents/article-agent"
import { createArticleAgent } from "./agents/create-article-agent"
import { postgres, postgresVector } from "./store/pg"
import { createArticleWorkflow } from "./workflows/create-article-workflow"

export const mastra = new Mastra({
	workflows: { createArticleWorkflow },
	agents: { createArticleAgent, articleAgent },

	memory: {
		default: new Memory({
			storage: postgres,
			vector: postgresVector,
		}),
	},

	storage: new LibSQLStore({
		id: "mastra-storage",
		// stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
		url: ":memory:",
	}),

	logger: new PinoLogger({
		name: "Mastra",
		level: "info",
	}),

	observability: new Observability({
		configs: {
			default: {
				serviceName: "mastra",
				exporters: [
					new DefaultExporter(), // Persists traces to storage for Mastra Studio
					new CloudExporter(), // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
				],
				spanOutputProcessors: [
					new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
				],
			},
		},
	}),
})
