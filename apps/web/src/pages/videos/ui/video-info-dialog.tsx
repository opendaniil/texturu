import type { VideoResponse } from "@texturu/schemas"
import type { ReactNode } from "react"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/ui/dialog"

type VideoInfoDialogProps = {
	video: VideoResponse
	children: ReactNode
}

export function VideoInfoDialog({ video, children }: VideoInfoDialogProps) {
	const details = JSON.stringify(video, null, 2)

	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>

			<DialogContent className="sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>Полная информация о видео</DialogTitle>
					<DialogDescription>JSON</DialogDescription>
				</DialogHeader>

				<div className="max-h-[70dvh] overflow-y-auto rounded-md border bg-muted/30 p-3">
					<pre className="whitespace-pre-wrap break-all font-mono text-xs leading-5">
						{details}
					</pre>
				</div>
			</DialogContent>
		</Dialog>
	)
}
