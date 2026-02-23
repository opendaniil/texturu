import {
	type ChatTransport,
	generateId,
	type UIMessage,
	type UIMessageChunk,
} from "ai"
import { sendChatMessage } from "./send-chat-message"

/**
 * Explicit adapter layer: keeps useChat() API while backend stays JSON-only.
 * Replace this adapter with DefaultChatTransport when backend stream endpoint is ready.
 */
const getLastUserText = (messages: UIMessage[]): string => {
	const lastUserMessage = [...messages]
		.reverse()
		.find((message) => message.role === "user")

	if (!lastUserMessage) {
		return ""
	}

	return lastUserMessage.parts
		.filter((part) => part.type === "text")
		.map((part) => part.text)
		.join("")
		.trim()
}

const toUiMessageStream = (text: string): ReadableStream<UIMessageChunk> => {
	const textPartId = generateId()

	return new ReadableStream<UIMessageChunk>({
		start(controller) {
			controller.enqueue({ type: "start" })
			controller.enqueue({ type: "start-step" })
			controller.enqueue({ type: "text-start", id: textPartId })
			controller.enqueue({ type: "text-delta", id: textPartId, delta: text })
			controller.enqueue({ type: "text-end", id: textPartId })
			controller.enqueue({ type: "finish-step" })
			controller.enqueue({ type: "finish", finishReason: "stop" })
			controller.close()
		},
	})
}

export class JsonChatTransportAdapter implements ChatTransport<UIMessage> {
	async sendMessages(
		options: Parameters<ChatTransport<UIMessage>["sendMessages"]>[0]
	): Promise<ReadableStream<UIMessageChunk>> {
		const message = getLastUserText(options.messages)
		if (!message) {
			throw new Error("User message is empty")
		}

		const response = await sendChatMessage({
			message,
			signal: options.abortSignal,
		})

		return toUiMessageStream(response.message)
	}

	async reconnectToStream(
		_options: Parameters<ChatTransport<UIMessage>["reconnectToStream"]>[0]
	): Promise<ReadableStream<UIMessageChunk> | null> {
		return null
	}
}
