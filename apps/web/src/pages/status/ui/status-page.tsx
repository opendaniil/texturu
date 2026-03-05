"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { ApiClientError } from "@/shared/lib/api-client"
import { useDocumentTitle } from "@/shared/lib/use-document-title"
import { Button } from "@/shared/ui/button"
import { container } from "@/shared/ui/container"
import {
	formatStatusTitle,
	useVideoStatusPoll,
} from "../model/video-status-poll"
import { StatusError } from "./status-error"
import { StatusStepper } from "./status-stepper"
import { StatusVideo } from "./status-video"

export const metadata = {
	title: "Статус видео",
}

function getBackendErrorMessage(error: unknown): string {
	if (error instanceof ApiClientError) {
		if (error.status === 404) return "Видео не найдено"
		if (error.status >= 500) return "Проблема на сервере. Пробуем снова..."
		return `Не удалось получить статус видео (HTTP ${error.status})`
	}

	if (error instanceof TypeError) {
		return "Проблема с сетью. Проверьте соединение"
	}

	return "Не удалось получить статус видео. Пробуем снова..."
}

export default function StatusPage({ slug }: { slug: string }) {
	const router = useRouter()
	const { data, isError: isBackendError, error } = useVideoStatusPoll(slug)

	const isProcessError = data?.status === "error"
	const isShowStepper = !!data && !isProcessError
	const isShowBackendError = isBackendError && !data

	useDocumentTitle(data ? formatStatusTitle(data) : null)

	const articleHref =
		data?.status === "done" ? `/article/${data.articleSlug}` : null
	useEffect(() => {
		if (articleHref) {
			router.replace(articleHref)
		}
	}, [articleHref, router])

	return (
		<main className="">
			<section className="py-8 sm:py-12">
				<div className={`${container.reading} flex flex-col gap-5`}>
					<StatusVideo source={data?.source} externalId={data?.externalId} />

					<div className="flex justify-center">
						{isProcessError && <StatusError message={data.statusMessage} />}

						{isShowBackendError && (
							<StatusError message={getBackendErrorMessage(error)} />
						)}

						{isShowStepper && (
							<StatusStepper
								status={data.status}
								statusMessage={data.statusMessage}
							/>
						)}
					</div>

					{isBackendError && data && (
						<p className="text-sm text-muted-foreground text-center">
							Не удалось обновить статус. Пробуем снова...
						</p>
					)}

					{articleHref && (
						<Button onClick={() => router.push(articleHref)} className="w-full">
							Перейти к статье
						</Button>
					)}
				</div>
			</section>
		</main>
	)
}
