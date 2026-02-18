"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import * as React from "react"

export function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = React.useState(() => new QueryClient())

	return (
		<NuqsAdapter>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</NuqsAdapter>
	)
}
