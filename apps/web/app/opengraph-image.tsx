import { ImageResponse } from "next/og"

export const runtime = "edge"

export const alt = "Textu.ru — читать видео вместо просмотра"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
	return new ImageResponse(
		<div
			style={{
				background:
					"linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)",
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				padding: "60px",
			}}
		>
			<div style={{ fontSize: 96, marginBottom: 24, display: "flex" }}>📺</div>
			<div
				style={{
					fontSize: 64,
					fontWeight: 700,
					color: "#ffffff",
					marginBottom: 16,
					display: "flex",
				}}
			>
				Textu.ru
			</div>
			<div
				style={{
					fontSize: 32,
					color: "#a0a0b0",
					display: "flex",
				}}
			>
				Читать видео вместо просмотра
			</div>
		</div>,
		{ ...size }
	)
}
