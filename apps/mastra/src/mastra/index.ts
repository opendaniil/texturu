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
import { PgVector, PostgresStore } from "@mastra/pg"
import { weatherAgent } from "./agents/weather-agent"
import {
	completenessScorer,
	toolCallAppropriatenessScorer,
	translationScorer,
} from "./scorers/weather-scorer"
import { weatherWorkflow } from "./workflows/weather-workflow"

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
	throw new Error("DATABASE_URL is required")
}

export const mastra = new Mastra({
	workflows: { weatherWorkflow },
	agents: { weatherAgent },
	scorers: {
		toolCallAppropriatenessScorer,
		completenessScorer,
		translationScorer,
	},

	memory: {
		default: new Memory({
			storage: new PostgresStore({
				id: "pg-storage",
				connectionString: DATABASE_URL,
			}),
			vector: new PgVector({
				id: "pg-vector",
				connectionString: DATABASE_URL,
			}),
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
