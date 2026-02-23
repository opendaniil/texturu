import { DIMENSION_E5 } from "../models/multilingual-e5-large"
import { postgresVector } from "./pg"

export async function createIndexes() {
	console.log("Creating indexes...")

	await postgresVector.createIndex({
		indexName: "subtitles",
		dimension: DIMENSION_E5,
		metric: "cosine",
	})
}
