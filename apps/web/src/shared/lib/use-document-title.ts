import { useEffect, useRef } from "react"

export function useDocumentTitle(title: string | null) {
	const originalTitle = useRef<string>("")
	const appliedTitle = useRef<string | null>(null)

	useEffect(() => {
		originalTitle.current = document.title
		return () => {
			if (appliedTitle.current && document.title === appliedTitle.current) {
				document.title = originalTitle.current
			}
		}
	}, [])

	useEffect(() => {
		if (!title) return
		appliedTitle.current = title
		document.title = title
	}, [title])
}
