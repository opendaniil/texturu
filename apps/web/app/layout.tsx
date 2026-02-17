import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import "../src/app/globals.css"
import { Providers } from "@/app/providers"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
})

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
})

export const metadata: Metadata = {
	title: "TubeBook App",
	description: "Читать видео вместо просмотра",
	icons: {
		icon: [
			{
				url: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📺</text></svg>",
			},
		],
	},
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="ru" className={inter.variable}>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
