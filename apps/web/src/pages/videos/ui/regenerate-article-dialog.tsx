"use client"

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
import { regenerateArticle } from "../api/regenerate-article"

type RegenerateArticleDialogProps = {
	videoId: string
	children: ReactNode
}

export function RegenerateArticleDialog({
	videoId,
	children,
}: RegenerateArticleDialogProps) {
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
			await regenerateArticle(videoId, adminKey)
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
					<DialogTitle>Регенерация статьи</DialogTitle>
					<DialogDescription>
						Введите админский ключ для подтверждения
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
						<Button type="submit" disabled={isPending || !adminKey}>
							{isPending ? "Отправка..." : "Регенерировать"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
