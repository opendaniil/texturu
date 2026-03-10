"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { ApiClientError } from "@/shared/lib/api-client"
import { useDocumentTitle } from "@/shared/lib/use-document-title"
import { Button } from "@/shared/ui/button"
import { container } from "@/shared/ui/container"
import { Spinner } from "@/shared/ui/spinner"
import {
	formatStatusTitle,
	isNotFoundError,
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
		if (error.status >= 500) return "Проблема на сервере. Пробуем снова..."
		return `Не удалось получить статус видео (HTTP ${error.status})`
	}

	if (error instanceof TypeError) {
		return "Проблема с сетью. Проверьте соединение"
	}

	return "Не удалось получить статус видео. Пробуем снова..."
}

function isRetryableError(error: unknown): boolean {
	if (isNotFoundError(error)) return false
	if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) return false
	return true
}

export default function StatusPage({ slug }: { slug: string }) {
	const router = useRouter()
	const {
		data,
		isPending,
		isError: isBackendError,
		error,
	} = useVideoStatusPoll(slug)

	const is404 = isNotFoundError(error)
	const isProcessError = data?.status === "error"
	const isShowStepper = !!data && !isProcessError && !is404
	const isShowBackendError = isBackendError && !data
	const isRetrying = isBackendError && !is404 && isRetryableError(error)

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
						{isPending && !data && (
							<Spinner className="size-8" />
						)}

						{isProcessError && (
							<StatusError
								title="Не удалось обработать видео"
								message={data.statusMessage}
							>
								<Button asChild variant="outline" className="w-full">
									<Link href="/">Попробовать другое видео</Link>
								</Button>
							</StatusError>
						)}

						{is404 && (
							<StatusError title="Видео не найдено">
								<Button asChild variant="outline" className="w-full">
									<Link href="/">На главную</Link>
								</Button>
							</StatusError>
						)}

						{isShowBackendError && !is404 && (
							<StatusError
								title="Проблема с сервером"
								message={getBackendErrorMessage(error)}
							>
								{isRetrying && (
									<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
										<Spinner className="size-4" />
										<span>Пробуем снова...</span>
									</div>
								)}
							</StatusError>
						)}

						{isShowStepper && (
							<StatusStepper
								status={data.status}
								statusMessage={data.statusMessage}
							/>
						)}
					</div>

					{isBackendError && data && !is404 && (
						<p className="text-sm text-muted-foreground text-center">
							Не удалось обновить статус. Пробуем снова...
						</p>
					)}

					{articleHref && (
						<Button onClick={() => router.push(articleHref)} className="w-full">
							Перейти к статье
						</Button>
					)}
				</div>
			</section>
		</main>
	)
}
