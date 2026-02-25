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

	const isProcessError = data?.status === "error"
	const isShowStepper = !isBackendError && !isProcessError && data

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

						{isBackendError && <StatusError message={error.message} />}

						{isShowStepper && (
							<StatusStepper
								status={data.status}
								statusMessage={data.statusMessage}
							/>
						)}
					</div>

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
