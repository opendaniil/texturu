"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import * as z from "zod"
import { Button } from "@/shared/ui/button"
import { Field, FieldError, FieldGroup } from "@/shared/ui/field"
import { Input } from "@/shared/ui/input"
import { addVideo } from "../api/add-video"
import { linkSchema } from "../model/link-schema"

const formSchema = z.object({
	text: linkSchema,
})

export function SendLinkForm() {
	const router = useRouter()
	const addVideoMutation = useMutation({
		mutationFn: addVideo,
		onSuccess: async (data) => {
			router.push(`/status/${data.redirectTo}`)
		},
	})

	const form = useForm({
		defaultValues: {
			text: "",
		},
		validators: {
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			const parsed = formSchema.parse(value)

			await addVideoMutation.mutateAsync({
				source: "youtube",
				externalId: parsed.text,
			})
		},
	})

	return (
		<form
			noValidate
			className="flex w-full flex-col gap-2 sm:flex-row sm:items-start"
			onSubmit={(e) => {
				e.preventDefault()
				form.handleSubmit()
			}}
		>
			<FieldGroup>
				<form.Field name="text">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid

						return (
							<Field data-invalid={isInvalid}>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									aria-invalid={isInvalid}
									placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
									autoComplete="off"
								/>

								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						)
					}}
				</form.Field>
			</FieldGroup>

			<Button type="submit" disabled={addVideoMutation.isPending}>
				{addVideoMutation.isPending ? "Загрузка…" : "Прочитать видео"}
			</Button>

			<div>
				{addVideoMutation.isError && (
					<p className="text-sm text-red-600 mt-2">
						{(addVideoMutation.error as Error).message}
					</p>
				)}
			</div>
		</form>
	)
}
