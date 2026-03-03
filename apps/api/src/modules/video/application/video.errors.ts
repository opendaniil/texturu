import { DomainError } from "src/common/errors/domain.error"

export class QueueUnavailableError extends DomainError {
	constructor(cause?: unknown) {
		super("Queue is temporarily unavailable, please retry later.", 503, cause)
	}
}

export class CaptionsNotFoundError extends DomainError {
	constructor(videoId: string) {
		super(`No subtitle tracks found for video ${videoId}`)
	}
}

export class SubtitleDownloadError extends DomainError {
	constructor(videoId: string) {
		super(`No .vtt subtitle files found for video ${videoId}`)
	}
}

export class PlainTextNotFoundError extends DomainError {
	constructor(videoId: string) {
		super(`No plain text found for video ${videoId}`)
	}
}
