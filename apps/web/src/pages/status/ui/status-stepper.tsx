import {
	type VideoStatusResponse,
	videoStatusProgressOrder,
} from "@tubebook/schemas"
import { Spinner } from "@/shared/ui/spinner"
import {
	Stepper,
	StepperContent,
	StepperIndicator,
	StepperItem,
	StepperList,
	StepperSeparator,
	StepperTrigger,
} from "@/shared/ui/stepper"

const steps = videoStatusProgressOrder

type StatusStepperProps = {
	status: VideoStatusResponse["status"]
	statusMessage: string
}

export function StatusStepper({ status, statusMessage }: StatusStepperProps) {
	const isDone = status === "done"

	return (
		<Stepper nonInteractive value={status} className="w-full max-w-xl">
			<StepperList>
				{steps.map((step) => (
					<StepperItem key={step} value={step}>
						<StepperTrigger>
							<StepperIndicator />
						</StepperTrigger>

						<StepperSeparator />
					</StepperItem>
				))}
			</StepperList>

			{steps.map((step) => (
				<StepperContent
					key={step}
					value={step}
					className="flex flex-col items-center gap-4 rounded-md border bg-card p-4 text-card-foreground"
				>
					<p className="text-sm">{statusMessage}</p>

					{!isDone && <Spinner className="size-8" />}
				</StepperContent>
			))}
		</Stepper>
	)
}
