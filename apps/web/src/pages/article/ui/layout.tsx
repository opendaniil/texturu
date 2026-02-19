import { ScrollProgress } from "@/shared/ui/scroll-progress"
import Footer from "./footer"

export function ArticleLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<ScrollProgress className="top-[65px]" />
			{children}
			<Footer
				leftLinks={[{ href: "/", label: "Добавить своё видео" }]}
				rightLinks={[]}
				copyrightText={`TubeBook ${new Date().getFullYear()}`}
				barCount={23}
			/>
		</>
	)
}
