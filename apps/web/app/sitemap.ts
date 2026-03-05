import type { SitemapVideoArticlesResponse } from "@texturu/schemas"
import type { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://textu.ru"
const API_HOST = process.env.NEXT_PUBLIC_API_HOST ?? ""

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const staticPages: MetadataRoute.Sitemap = [
		{ url: SITE_URL, lastModified: new Date() },
	]

	if (!API_HOST) {
		return staticPages
	}

	try {
		const response = await fetch(`${API_HOST}/api/video/articles/sitemap`)
		const { items } = (await response.json()) as SitemapVideoArticlesResponse

		const articles: MetadataRoute.Sitemap = items.map((item) => ({
			url: `${SITE_URL}/article/${item.slug}`,
			lastModified: item.updatedAt,
		}))

		return [...staticPages, ...articles]
	} catch {
		return staticPages
	}
}
