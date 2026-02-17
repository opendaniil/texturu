"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { useVideoStatusPoll } from "../model/video-status-poll"
import { StatusError } from "./status-error"
import { StatusStepper } from "./status-stepper"
import { StatusVideo } from "./status-video"

export default function StatusPage({ slug }: { slug: string }) {
	const router = useRouter()
	const { data, isError: isBackendError, error } = useVideoStatusPoll(slug)

	if (data?.status === "done") {
		router.replace(`/article/${data.id}`)
	}

	const isDone = data?.status === "done"
	const isProcessError = data?.status === "error"

	return (
		<div className="min-h-screen w-full">
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
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
		</div>
	)
}
