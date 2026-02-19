"use client"

import { Button } from "@/shared/ui/button"
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/shared/ui/drawer"

export function ArticleBotDrawer() {
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

			<DrawerContent className="mx-auto w-full max-w-xl">
				<DrawerHeader>
					<DrawerTitle>Помощник по статье</DrawerTitle>
					<DrawerDescription>
						Здесь можно быстро открыть чат-ассистент по материалу.
					</DrawerDescription>
				</DrawerHeader>

				<div className="px-4 pb-2 text-sm text-muted-foreground">
					Чат скоро появится.
				</div>

				<DrawerFooter>
					<DrawerClose asChild>
						<Button variant="outline">Закрыть</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	)
}
