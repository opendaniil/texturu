import { useEffect, useRef } from "react"

export function useDocumentTitle(title: string | null) {
	const originalTitle = useRef<string>("")

	useEffect(() => {
		originalTitle.current = document.title
		return () => {
			document.title = originalTitle.current!
		}
	}, [])

	useEffect(() => {
		if (title) document.title = title
	}, [title])
}
