"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/shared/ui/button"
import { container } from "@/shared/ui/container"
import { useVideoStatusPoll } from "../model/video-status-poll"
import { StatusError } from "./status-error"
import { StatusStepper } from "./status-stepper"
import { StatusVideo } from "./status-video"

export const metadata = {
	title: "Статус видео",
}

export default function StatusPage({ slug }: { slug: string }) {
	const router = useRouter()
	const { data, isError: isBackendError, error } = useVideoStatusPoll(slug)

	useEffect(() => {
		if (data?.status === "done") {
			router.replace(`/article/${data.id}`)
		}
	}, [data?.id, data?.status, router])

	const isDone = data?.status === "done"
	const isProcessError = data?.status === "error"

	return (
		<main className="min-h-dvh">
			<section className="py-8 sm:py-12">
				<div className={`${container.reading} flex flex-col gap-5`}>
					<StatusVideo source={data?.source} externalId={data?.externalId} />

					<div className="flex justify-center">
						{isProcessError && <StatusError message={data.statusMessage} />}

						{isBackendError && <StatusError message={error.message} />}

						{data && !(isProcessError || isBackendError) && (
							<StatusStepper
								status={data.status}
								statusMessage={data.statusMessage}
							/>
						)}
					</div>

					{isDone && (
						<Button
							onClick={() => router.push(`/article/${data.id}`)}
							className="w-full"
						>
							Перейти к статье
						</Button>
					)}
				</div>
			</section>
		</main>
	)
}
