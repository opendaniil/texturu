import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/app/providers"
import { Header } from "@/widgets/header"

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
	metadataBase: new URL("https://textu.ru"),
	title: {
		template: "%s | Texturu App",
		default: "Texturu App",
	},
	description: "Читать видео вместо просмотра",

	icons: {
		icon: [
			{
				url: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📺</text></svg>",
			},
		],
	},

	applicationName: "Texturu App",
	openGraph: {
		siteName: "Texturu App",
		type: "website",
		locale: "ru_RU",
	},
	twitter: {
		card: "summary_large_image",
	},
	robots: {
		index: true,
		follow: true,
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
				className={`${geistSans.variable} ${geistMono.variable} flex min-h-dvh flex-col antialiased`}
			>
				<Providers>
					<Header />
					{children}
				</Providers>
			</body>
		</html>
	)
}
