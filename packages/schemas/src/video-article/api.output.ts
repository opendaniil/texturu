import type { z } from "zod"
import { videoArticleApiSchema } from "./api"

export const videoArticleResponseSchema = videoArticleApiSchema

export type VideoArticleResponse = z.infer<typeof videoArticleResponseSchema>
