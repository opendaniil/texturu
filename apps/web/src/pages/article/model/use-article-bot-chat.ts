"use client"

import { useChat } from "@ai-sdk/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { ChatHistoryResponse } from "@texturu/schemas"
import { DefaultChatTransport, isTextUIPart } from "ai"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { getChatHistory } from "../api/get-chat-history"

type UseArticleBotChatParams = {
	articleId: string
}

type SubmitMessage = {
	text: string
}

export function useArticleBotChat({ articleId }: UseArticleBotChatParams) {
	const queryClient = useQueryClient()
	const hasHydratedHistoryRef = useRef(false)
	const historyQueryKey = useMemo(
		() => ["article-chat-history", articleId] as const,
		[articleId]
	)

	const transport = useMemo(
		() =>
			new DefaultChatTransport({
				api: `${process.env.NEXT_PUBLIC_API_HOST}/api/chat/stream`,
				credentials: "include",
				body: {
					articleId,
				},
			}),
		[articleId]
	)

	const { messages, setMessages, sendMessage, status, stop, error } = useChat({
		id: `article:${articleId}`,
		transport,
	})

	// при смене статьи заново делаем гидрацию истории
	// biome-ignore lint/correctness/useExhaustiveDependencies: нужно
	useEffect(() => {
		hasHydratedHistoryRef.current = false
	}, [articleId])

	const chatHistoryQuery = useQuery({
		queryKey: historyQueryKey,
		queryFn: ({ signal }) =>
			getChatHistory(
				{
					articleId,
				},
				signal
			),
		enabled: articleId.trim().length > 0,
		retry: false,
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	})

	// один раз перекладываем историю в локальные сообщения useChat
	useEffect(() => {
		const history = chatHistoryQuery.data
		if (!history || hasHydratedHistoryRef.current || messages.length > 0) {
			return
		}

		hasHydratedHistoryRef.current = true
		// пустую историю тоже считаем гидрированной
		if (history.messages.length === 0) {
			return
		}

		// схема истории шире, чем тип сообщений useChat
		// @ts-expect-error
		setMessages(history.messages)
	}, [chatHistoryQuery.data, messages.length, setMessages])

	// если сообщения уже появились локально, историю больше не гидрируем
	useEffect(() => {
		if (messages.length > 0 && !hasHydratedHistoryRef.current) {
			hasHydratedHistoryRef.current = true
		}
	}, [messages.length])

	// держим query кеш синхронным с текущими сообщениями чата
	useEffect(() => {
		if (articleId.trim().length === 0) return

		// не перетираем кеш пустым массивом до первой гидрации
		if (!hasHydratedHistoryRef.current && messages.length === 0) {
			return
		}

		queryClient.setQueryData<ChatHistoryResponse>(historyQueryKey, {
			messages,
		})
	}, [articleId, historyQueryKey, messages, queryClient])

	const isSending = status === "submitted" || status === "streaming"

	const getMessageText = useCallback(
		(message: (typeof messages)[number]) =>
			message.parts
				.filter(isTextUIPart)
				.map((part) => part.text)
				.join(""),
		[]
	)

	const lastMessage = messages[messages.length - 1]
	const shouldShowLoadingMessage =
		isSending &&
		(lastMessage?.role !== "assistant" ||
			getMessageText(lastMessage).trim().length === 0)

	const handleSubmit = useCallback(
		async ({ text }: SubmitMessage) => {
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

	return {
		error,
		getMessageText,
		handleSubmit,
		isSending,
		messages,
		shouldShowLoadingMessage,
		status,
		stop,
	}
}
