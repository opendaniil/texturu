"use client"

import { useQueryClient } from "@tanstack/react-query"
import { type ReactNode, useState } from "react"
import { ApiClientError } from "@/shared/lib/api-client"
import { Button } from "@/shared/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { deleteVideo } from "../api/delete-video"

type DeleteVideoDialogProps = {
	videoId: string
	children: ReactNode
}

export function DeleteVideoDialog({
	videoId,
	children,
}: DeleteVideoDialogProps) {
	const queryClient = useQueryClient()
	const [open, setOpen] = useState(false)
	const [adminKey, setAdminKey] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [isPending, setIsPending] = useState(false)

	function handleOpenChange(next: boolean) {
		setOpen(next)
		if (!next) {
			setAdminKey("")
			setError(null)
		}
	}

	async function handleSubmit(e: React.SubmitEvent) {
		e.preventDefault()
		setError(null)
		setIsPending(true)

		try {
			await deleteVideo(videoId, adminKey)
			await queryClient.invalidateQueries({ queryKey: ["videos"] })
			handleOpenChange(false)
		} catch (err) {
			if (err instanceof ApiClientError && err.status === 403) {
				setError("Неверный ключ")
			} else {
				setError(err instanceof Error ? err.message : "Неизвестная ошибка")
			}
		} finally {
			setIsPending(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{children}</DialogTrigger>

			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Удаление видео</DialogTitle>
					<DialogDescription>
						Видео и связанные данные будут удалены. Введите админский ключ для
						подтверждения.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						type="password"
						placeholder="Админский ключ"
						value={adminKey}
						onChange={(e) => setAdminKey(e.target.value)}
						autoFocus
					/>

					{error && <p className="text-sm text-destructive">{error}</p>}

					<DialogFooter>
						<Button
							type="submit"
							variant="destructive"
							disabled={isPending || !adminKey}
						>
							{isPending ? "Удаление..." : "Удалить"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
