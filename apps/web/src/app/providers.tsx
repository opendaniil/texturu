"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import * as React from "react"
import { TooltipProvider } from "@/shared/ui/tooltip"

export function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = React.useState(() => new QueryClient())

	return (
		<NuqsAdapter>
			<TooltipProvider>
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			</TooltipProvider>
		</NuqsAdapter>
	)
}
