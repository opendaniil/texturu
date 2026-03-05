import { ImageResponse } from "next/og"
import { getArticle } from "@/pages/article/api/get-article"

export const runtime = "edge"

export const alt = "Textu.ru — статья"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	const article = await getArticle(slug)

	const title = article?.title ?? "Статья не найдена"
	const channel = article?.info.channelTitle ?? ""

	return new ImageResponse(
		<div
			style={{
				background:
					"linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)",
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				padding: "60px",
			}}
		>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: 16,
				}}
			>
				<div
					style={{
						fontSize: 48,
						fontWeight: 700,
						color: "#ffffff",
						lineClamp: 3,
						display: "flex",
					}}
				>
					{title.length > 100 ? `${title.slice(0, 100)}...` : title}
				</div>
				{channel && (
					<div
						style={{
							fontSize: 28,
							color: "#a0a0b0",
							display: "flex",
						}}
					>
						{channel}
					</div>
				)}
			</div>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 12,
				}}
			>
				<div style={{ fontSize: 36, display: "flex" }}>📺</div>
				<div
					style={{
						fontSize: 28,
						fontWeight: 600,
						color: "#a0a0b0",
						display: "flex",
					}}
				>
					textu.ru
				</div>
			</div>
		</div>,
		{ ...size }
	)
}
