type StatusErrorProps = {
	message?: string
}

export function StatusError({ message }: StatusErrorProps) {
	return (
		<div className="rounded-md border border-destructive/40 bg-destructive/5 p-4">
			<p className="text-destructive text-sm">{message}</p>
		</div>
	)
}
