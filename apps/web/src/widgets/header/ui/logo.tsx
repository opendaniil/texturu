import { Clapperboard } from "lucide-react"

export function Logo() {
	return (
		<div className="flex items-center gap-2">
			<div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
				<Clapperboard className="size-4" />
			</div>
			<p className="text-sm font-semibold tracking-tight">TubeBook</p>
		</div>
	)
}
