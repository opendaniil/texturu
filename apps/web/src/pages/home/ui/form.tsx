"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { LucideEraser } from "lucide-react"
import { useRouter } from "next/navigation"
import * as z from "zod"
import { Button } from "@/shared/ui/button"
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/shared/ui/field"
import { Input } from "@/shared/ui/input"
import { addVideo } from "../api/add-video"
import { linkSchema } from "../model/link-schema"

const formSchema = z.object({
	text: linkSchema,
})

export function Form() {
	const router = useRouter()
	const addVideoMutation = useMutation({
		mutationFn: addVideo,
		onSuccess: async (data) => {
			router.push(`/video/${data.redirectTo}`)
		},
	})

	const form = useForm({
		defaultValues: {
			text: "https://www.youtube.com/watch?v=UEQSkaqrMZA&pp=ygUEdGVzdNIHCQmRCgGHKiGM7w%3D%3D",
		},
		validators: {
			onSubmit: formSchema,
			onBlur: formSchema,
		},
		onSubmit: async ({ value }) => {
			const parsed = formSchema.parse(value)
			// Use mutation to add video; source defaults to "youtube"
			await addVideoMutation.mutateAsync({ externalId: parsed.text })
		},
	})

	return (
		<form
			noValidate
			className="space-y-4 w-full"
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
								<FieldLabel htmlFor={field.name}>
									Прочитать видео с ютуба
								</FieldLabel>

								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									aria-invalid={isInvalid}
									placeholder="https://www.youtube.com/watch?v=TuBeB00K"
									autoComplete="off"
								/>

								{!isInvalid && (
									<FieldDescription>От 3 до 50 символов.</FieldDescription>
								)}

								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						)
					}}
				</form.Field>
			</FieldGroup>

			{addVideoMutation.isError && (
				<p className="text-sm text-red-600 mt-2">
					{(addVideoMutation.error as Error).message}
				</p>
			)}

			<div className="flex gap-2 justify-end  ">
				<Button type="button" variant="outline" onClick={() => form.reset()}>
					<LucideEraser className="h-4 w-4" />
				</Button>

				<Button type="submit" disabled={addVideoMutation.isPending}>
					{addVideoMutation.isPending ? "Загрузка…" : "Прочитать видео"}
				</Button>
			</div>
		</form>
	)
}
