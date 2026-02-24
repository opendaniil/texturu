"use client"

import { Button } from "@/shared/ui/button"
import { Drawer, DrawerContent, DrawerTrigger } from "@/shared/ui/drawer"
import { BotChat } from "./bot-chat"

type ArticleBotDrawerProps = {
	articleId: string
}

export function ArticleBotDrawer({ articleId }: ArticleBotDrawerProps) {
	return (
		<Drawer>
			<DrawerTrigger asChild>
				<Button
					size="icon-lg"
					className="fixed right-4 bottom-4 z-40 rounded-full shadow-lg md:right-10 md:top-1/2 md:bottom-auto md:-translate-y-1/2"
					aria-label="Открыть помощника по статье"
				>
					<span aria-hidden="true">🤖</span>
				</Button>
			</DrawerTrigger>

			<DrawerContent className="mx-auto flex h-[80vh] w-full max-w-xl">
				<BotChat articleId={articleId} />
			</DrawerContent>
		</Drawer>
	)
}
