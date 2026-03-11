import type { ReactNode } from "react"

type StatusErrorProps = {
	title: string
	message?: string
	children?: ReactNode
}

export function StatusError({ title, message, children }: StatusErrorProps) {
	return (
		<div className="flex flex-col gap-4 w-full max-w-xl">
			<div className="rounded-md border border-destructive/40 bg-destructive/5 p-4">
				<p className="text-lg text-destructive mb-2">{title}</p>
				{message && <p className="text-destructive text-sm">{message}</p>}
			</div>
			{children}
		</div>
	)
}
