"use client"

import { useChat } from "@ai-sdk/react"
import type { UIMessage } from "ai"
import { useCallback, useMemo } from "react"
import {
	Conversation,
	ConversationContent,
	ConversationEmptyState,
	ConversationScrollButton,
} from "@/shared/components/ai-elements/conversation"
import {
	Message,
	MessageContent,
	MessageResponse,
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
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/shared/ui/drawer"
import { JsonChatTransportAdapter } from "../api/json-chat-transport-adapter"

const isStreamingStatus = (status: string) =>
	status === "submitted" || status === "streaming"

const getMessageText = (message: UIMessage): string => {
	const text = message.parts
		.filter((part) => part.type === "text")
		.map((part) => part.text)
		.join("")
		.trim()

	if (text.length > 0) {
		return text
	}

	if (message.role === "assistant") {
		return "..."
	}

	return ""
}

type ArticleBotDrawerProps = {
	articleId: string
}

export function ArticleBotDrawer({ articleId }: ArticleBotDrawerProps) {
	const transport = useMemo(
		() => new JsonChatTransportAdapter(articleId),
		[articleId]
	)

	const { messages, sendMessage, status, stop, error } = useChat({
		transport,
	})

	const isSending = isStreamingStatus(status)

	const handleSubmit = useCallback(
		async ({ text }: PromptInputMessage) => {
			if (isSending) return

			const userContent = text.trim()
			if (!userContent) return

			await sendMessage({
				text: userContent,
			})
		},
		[isSending, sendMessage]
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
										<MessageContent>
											{message.role === "assistant" ? (
												<MessageResponse>
													{getMessageText(message)}
												</MessageResponse>
											) : (
												getMessageText(message)
											)}
										</MessageContent>
									</Message>
								))
							)}
						</ConversationContent>
						<ConversationScrollButton />
					</Conversation>
					{error && (
						<div className="px-4 pb-2 text-sm text-destructive">
							Не удалось получить ответ ассистента. Попробуйте отправить
							сообщение снова.
						</div>
					)}
				</div>

				<DrawerFooter className="gap-3 border-t">
					<PromptInput onSubmit={handleSubmit}>
						<PromptInputBody>
							<PromptInputTextarea
								placeholder="Ваше сообщение..."
								disabled={isSending}
								autoFocus
								aria-label="Ваше сообщение"
							/>
						</PromptInputBody>
						<PromptInputFooter>
							<PromptInputTools />
							<PromptInputSubmit
								disabled={status === "submitted"}
								onStop={stop}
								status={status}
							/>
						</PromptInputFooter>
					</PromptInput>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	)
}
