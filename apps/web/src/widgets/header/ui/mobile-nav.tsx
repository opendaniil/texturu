import { MenuIcon, XIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Portal, PortalBackdrop } from "@/shared/ui/portal"
import { navLinks } from "../model/nav-links"

interface MobileNavProps {
	currentPath: string
}

export function MobileNav({ currentPath }: MobileNavProps) {
	const [open, setOpen] = useState(false)

	useEffect(() => {
		if (!open) return

		const onEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setOpen(false)
			}
		}

		window.addEventListener("keydown", onEscape)
		return () => window.removeEventListener("keydown", onEscape)
	}, [open])

	useEffect(() => {
		setOpen(false)
	}, [])

	return (
		<div className="md:hidden">
			<Button
				aria-controls="mobile-menu"
				aria-expanded={open}
				aria-label="Toggle menu"
				className="size-10 rounded-full border-border/70 bg-background/90"
				onClick={() => setOpen(!open)}
				size="icon"
				variant="outline"
			>
				{open ? (
					<XIcon className="size-4.5" />
				) : (
					<MenuIcon className="size-4.5" />
				)}
			</Button>

			{open && (
				<Portal className="top-16" id="mobile-menu">
					<PortalBackdrop data-state="open" />
					<div
						className={cn(
							"data-[slot=open]:zoom-in-97 data-[slot=open]:animate-in ease-out",
							"flex size-full justify-end"
						)}
						data-slot="open"
					>
						<div className="h-full w-full max-w-sm border-l border-border/70 bg-background/95 p-4 shadow-2xl backdrop-blur">
							<div className="grid gap-y-2">
								{navLinks.map((link) => (
									<Button
										asChild
										className={cn(
											"justify-start rounded-lg text-base",
											currentPath === link.href &&
												"bg-secondary text-foreground"
										)}
										key={link.label}
										variant="ghost"
									>
										<Link href={link.href} onClick={() => setOpen(false)}>
											{link.label}
										</Link>
									</Button>
								))}
							</div>
						</div>
					</div>
				</Portal>
			)}
		</div>
	)
}
