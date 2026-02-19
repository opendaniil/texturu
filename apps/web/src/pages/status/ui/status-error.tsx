type StatusErrorProps = {
	message?: string
}

export function StatusError({ message }: StatusErrorProps) {
	return (
		<div className="flex flex-col gap-4">
			<div className="rounded-md border border-destructive/40 bg-destructive/5 p-4">
				<p className="text-lg text-destructive mb-2">Произошла ошибка</p>
				<p className="text-destructive mb-8">
					Проблема получения и обработки видео. Попробуйте позже
				</p>

				<p className="text-destructive text-sm">Error</p>
				<p className="text-destructive text-sm">{message}</p>
			</div>
		</div>
	)
}
