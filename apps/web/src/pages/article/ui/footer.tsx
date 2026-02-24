"use client"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/shared/ui/button"
import { container } from "@/shared/ui/container"

interface LinkItem {
	href: string
	label: string
}

interface FooterProps {
	leftLinks: LinkItem[]
	rightLinks: LinkItem[]
	copyrightText: string
	barCount?: number
}

export default function Footer({
	leftLinks,
	rightLinks,
	copyrightText,
	barCount = 23,
}: FooterProps) {
	const waveRefs = useRef<(HTMLDivElement | null)[]>([])
	const footerRef = useRef<HTMLElement | null>(null)
	const [isVisible, setIsVisible] = useState(false)
	const animationFrameRef = useRef<number | null>(null)
	const waveBars = useMemo(
		() =>
			Array.from({ length: barCount }, (_, index) => ({
				id: `bar-${index + 1}`,
				height: index + 1,
			})),
		[barCount]
	)

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries
				setIsVisible(entry.isIntersecting)
			},
			{ threshold: 0.2 }
		)

		const footerElement = footerRef.current

		if (footerElement) {
			observer.observe(footerElement)
		}

		return () => observer.disconnect()
	}, [])

	useEffect(() => {
		let t = 0

		const animateWave = () => {
			const waveElements = waveRefs.current
			let offset = 0

			waveElements.forEach((element, index) => {
				if (element) {
					offset += Math.max(0, 20 * Math.sin((t + index) * 0.3))
					element.style.transform = `translateY(${index + offset}px)`
				}
			})

			t += 0.1
			animationFrameRef.current = requestAnimationFrame(animateWave)
		}

		if (isVisible) {
			animateWave()
		} else if (animationFrameRef.current) {
			cancelAnimationFrame(animationFrameRef.current)
			animationFrameRef.current = null
		}

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current)
				animationFrameRef.current = null
			}
		}
	}, [isVisible])

	return (
		<footer
			ref={footerRef}
			className="relative flex h-full w-full flex-col justify-between bg-black text-white select-none"
		>
			<section className="py-8">
				<div
					className={`${container.narrow} flex w-full flex-col justify-between gap-4 md:flex-row`}
				>
					<div className="space-y-2">
						<ul className="flex flex-wrap gap-4">
							{leftLinks.map((link) => (
								<li key={link.label}>
									<Link href={link.href} className="text-sm hover:text-sky-400">
										{link.label}
									</Link>
								</li>
							))}
						</ul>
						<p className="mt-4 flex items-center gap-x-1 text-sm">
							{copyrightText}
						</p>
					</div>
					<div className="space-y-4">
						<ul className="flex flex-wrap gap-4">
							{rightLinks.map((link) => (
								<li key={link.label}>
									<Link href={link.href} className="text-sm hover:text-sky-400">
										{link.label}
									</Link>
								</li>
							))}
						</ul>
						<div className="mt-4 text-right">
							<Button
								className="inline-flex items-center text-sm hover:underline"
								onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
							>
								Наверх
							</Button>
						</div>
					</div>
				</div>
			</section>
			<div aria-hidden="true" className="h-[200px] overflow-hidden">
				{waveBars.map((bar, index) => (
					<div
						key={bar.id}
						ref={(el) => {
							waveRefs.current[index] = el
						}}
						className="-mt-0.5 bg-white transition-transform duration-100 ease-in [will-change:transform]"
						style={{ height: `${bar.height}px` }}
					/>
				))}
			</div>
		</footer>
	)
}
