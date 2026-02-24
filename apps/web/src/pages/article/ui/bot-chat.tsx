"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, isTextUIPart } from "ai"
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
import {
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/shared/ui/drawer"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST

type BotChatProps = {
	articleId: string
}

export function BotChat({ articleId }: BotChatProps) {
	const transport = useMemo(
		() =>
			new DefaultChatTransport({
				api: `${API_HOST}/api/chat/stream`,
				credentials: "include",
				body: {
					articleId,
				},
			}),
		[articleId]
	)

	const { messages, sendMessage, status, stop, error } = useChat({
		transport,
	})

	const isSending = status === "submitted" || status === "streaming"

	const handleSubmit = useCallback(
		async ({ text }: PromptInputMessage) => {
			if (isSending) return

			const userContent = text.trim()
			if (!userContent) return

			await sendMessage(
				{
					text: userContent,
				},
				{
					body: {
						message: userContent,
					},
				}
			)
		},
		[isSending, sendMessage]
	)

	return (
		<>
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
												{message.parts
													.filter(isTextUIPart)
													.map((part) => part.text)
													.join("") || "Думаю..."}
											</MessageResponse>
										) : (
											message.parts
												.filter(isTextUIPart)
												.map((part) => part.text)
												.join("")
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
		</>
	)
}
