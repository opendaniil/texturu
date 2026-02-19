"use client"

import { useCallback, useRef, useState } from "react"
import { sendChatMessage } from "../api/send-chat-message"
import {
	Conversation,
	ConversationContent,
	ConversationEmptyState,
	ConversationScrollButton,
} from "@/shared/components/ai-elements/conversation"
import {
	Message,
	MessageContent,
} from "@/shared/components/ai-elements/message"
import {
	PromptInput,
	PromptInputBody,
	PromptInputFooter,
	type PromptInputMessage,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
} from "@/shared/components/ai-elements/prompt-input"
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

type ChatItem = {
	id: number
	role: "user" | "assistant"
	content: string
}

export function ArticleBotDrawer() {
	const nextIdRef = useRef(0)
	const [messages, setMessages] = useState<ChatItem[]>([])
	const [isSending, setIsSending] = useState(false)

	const handleSubmit = useCallback(
		async ({ text }: PromptInputMessage) => {
			if (isSending) return

			const userContent = text.trim()
			if (!userContent) return

			const userMessage: ChatItem = {
				id: nextIdRef.current++,
				role: "user",
				content: userContent,
			}

			setMessages((prev) => [...prev, userMessage])
			setIsSending(true)

			try {
				const { message } = await sendChatMessage({ message: userContent })
				const assistantMessage: ChatItem = {
					id: nextIdRef.current++,
					role: "assistant",
					content: message,
				}

				setMessages((prev) => [...prev, assistantMessage])
			} catch {
				const assistantErrorMessage: ChatItem = {
					id: nextIdRef.current++,
					role: "assistant",
					content:
						"Не удалось получить ответ ассистента. Попробуйте отправить сообщение снова.",
				}

				setMessages((prev) => [...prev, assistantErrorMessage])
			} finally {
				setIsSending(false)
			}
		},
		[isSending]
	)

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
				<DrawerHeader className="border-b">
					<DrawerTitle>GPT</DrawerTitle>
					<DrawerDescription>Ваш помощник по статье</DrawerDescription>
				</DrawerHeader>

				<div className="flex min-h-0 flex-1 flex-col">
					<Conversation>
						<ConversationContent className="gap-4">
							{messages.length === 0 ? (
								<ConversationEmptyState
									title="Чат пуст"
									description="Задайте вопрос по статье, и я начну диалог."
								/>
							) : (
								messages.map((message) => (
									<Message key={message.id} from={message.role}>
										<MessageContent>{message.content}</MessageContent>
									</Message>
								))
							)}
						</ConversationContent>
						<ConversationScrollButton />
					</Conversation>
				</div>

				<DrawerFooter className="gap-3 border-t">
					<PromptInput onSubmit={handleSubmit}>
						<PromptInputBody>
							<PromptInputTextarea
								placeholder="Ваше сообщение..."
								disabled={isSending}
							/>
						</PromptInputBody>
						<PromptInputFooter>
							<PromptInputTools />
							<PromptInputSubmit disabled={isSending} />
						</PromptInputFooter>
					</PromptInput>
					<DrawerClose asChild>
						<Button className="w-full" variant="outline">
							Закрыть
						</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	)
}
