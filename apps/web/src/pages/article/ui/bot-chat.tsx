"use client"

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
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
} from "@/shared/components/ai-elements/prompt-input"
import { Shimmer } from "@/shared/components/ai-elements/shimmer"
import {
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/shared/ui/drawer"
import { useArticleBotChat } from "../model/use-article-bot-chat"

type BotChatProps = {
	articleId: string
}

export function BotChat({ articleId }: BotChatProps) {
	const {
		messages,
		status,
		stop,
		error,
		isSending,
		shouldShowLoadingMessage,
		getMessageText,
		handleSubmit,
	} = useArticleBotChat({ articleId })

	return (
		<>
			<DrawerHeader className="border-b">
				<DrawerTitle>GPT</DrawerTitle>
				<DrawerDescription>Ваш помощник по статье</DrawerDescription>
			</DrawerHeader>

			<div className="flex min-h-0 flex-1 flex-col">
				<Conversation>
					<ConversationContent className="gap-4">
						{messages.length === 0 && (
							<ConversationEmptyState
								title="Чат пуст"
								description="Задайте вопрос по статье, и я начну диалог."
							/>
						)}

						{messages.map((message) => (
							<Message key={message.id} from={message.role}>
								<MessageContent>
									{message.role === "assistant" && (
										<MessageResponse>{getMessageText(message)}</MessageResponse>
									)}

									{message.role === "user" && getMessageText(message)}
								</MessageContent>
							</Message>
						))}

						{shouldShowLoadingMessage && (
							<Message from={"assistant"}>
								<MessageContent>
									<Shimmer>Загрузка...</Shimmer>
								</MessageContent>
							</Message>
						)}
					</ConversationContent>
					<ConversationScrollButton />
				</Conversation>

				{error && (
					<div className="px-4 pb-2 text-sm text-destructive">
						Не удалось получить ответ ассистента. Попробуйте отправить сообщение
						снова.
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
