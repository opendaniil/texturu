"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useScroll } from "@/shared/hooks/use-scroll"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { container } from "@/shared/ui/container"
import { navLinks } from "../model/nav-links"
import { Logo } from "./logo"
import { MobileNav } from "./mobile-nav"

export function Header() {
	const scrolled = useScroll(10)
	const pathname = usePathname() ?? ""

	return (
		<header
			className={cn(
				"sticky top-0 z-50 w-full border-b border-transparent transition-all",
				scrolled &&
					"border-border/70 bg-background/95 shadow-[0_1px_0_0_hsl(var(--border))] backdrop-blur-sm supports-backdrop-filter:bg-background/70"
			)}
		>
			<nav
				className={cn(
					container.default,
					"max-w-5xl flex h-16 w-full items-center justify-between gap-4"
				)}
			>
				<Link
					className="rounded-xl p-1.5 transition-colors hover:bg-muted/70"
					href="/"
				>
					<Logo />
				</Link>

				<div className="hidden items-center gap-1 md:flex">
					{navLinks.map((link) => (
						<Button
							asChild
							key={link.label}
							size="sm"
							variant="ghost"
							className={cn(
								"rounded-full px-4 font-medium transition-colors",
								pathname === link.href && "bg-secondary text-foreground"
							)}
						>
							<Link href={link.href}>{link.label}</Link>
						</Button>
					))}
				</div>

				<MobileNav currentPath={pathname} />
			</nav>
		</header>
	)
}
