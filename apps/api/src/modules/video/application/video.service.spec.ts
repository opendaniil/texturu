import type { ListVideosQuery, Video, VideoInfo } from "@tubebook/schemas"
import { UowService } from "src/infra/database/unit-of-work.service"
import { VideoRepo } from "../data/video.repo"
import { VideoArticleRepo } from "../data/video-article.repo"
import { VideoInfoRepo } from "../data/video-info.repo"
import { VideoService } from "./video.service"
import { VideoJobsService } from "./video-jobs.service"

function makeVideo(overrides: Partial<Video> = {}): Video {
	return {
		id: "018f4f52-6f58-7cb3-8f9e-111111111111",
		source: "youtube",
		externalId: "dQw4w9WgXcQ",
		status: "queued",
		statusMessage: "",
		createdAt: new Date("2025-01-01T00:00:00.000Z"),
		updatedAt: new Date("2025-01-01T00:00:00.000Z"),
		...overrides,
	}
}

function makeVideoInfo(overrides: Partial<VideoInfo> = {}): VideoInfo {
	return {
		id: "018f4f52-6f58-7cb3-8f9e-222222222222",
		videoId: "018f4f52-6f58-7cb3-8f9e-111111111111",
		fulltitle: "Video title",
		description: "",
		channelId: "channel-id",
		channelTitle: "Channel",
		duration: 100,
		categories: [],
		tags: [],
		language: "ru",
		uploadDate: "20250101",
		createdAt: new Date("2025-01-01T00:00:00.000Z"),
		updatedAt: new Date("2025-01-01T00:00:00.000Z"),
		...overrides,
	}
}

describe("VideoService.list", () => {
	const baseQuery: ListVideosQuery = {
		pageIndex: 0,
		pageSize: 20,
		sortBy: "updatedAt",
		sortDir: "desc",
	}

	const createService = () => {
		const uow = { run: jest.fn() } as unknown as UowService
		const videoRepo = { findPage: jest.fn() }
		const videoInfoRepo = { findByVideoIds: jest.fn() }
		const videoArticleRepo = {} as VideoArticleRepo
		const videoJobsService = {} as VideoJobsService

		return {
			videoRepo,
			videoInfoRepo,
			service: new VideoService(
				uow,
				videoRepo as unknown as VideoRepo,
				videoInfoRepo as unknown as VideoInfoRepo,
				videoArticleRepo,
				videoJobsService
			),
		}
	}

	it("returns empty page and does not query infos when page is empty", async () => {
		const { service, videoRepo, videoInfoRepo } = createService()
		const query: ListVideosQuery = { ...baseQuery }

		jest.mocked(videoRepo.findPage).mockResolvedValue({
			items: [],
			rowCount: 0,
		})

		const result = await service.list(query)

		expect(videoRepo.findPage).toHaveBeenCalledWith(query)
		expect(videoInfoRepo.findByVideoIds).not.toHaveBeenCalled()
		expect(result).toEqual({
			items: [],
			rowCount: 0,
		})
	})

	it("enriches videos with info mapped by videoId", async () => {
		const { service, videoRepo, videoInfoRepo } = createService()
		const firstVideo = makeVideo({
			id: "018f4f52-6f58-7cb3-8f9e-333333333333",
			externalId: "3JZ_D3ELwOQ",
		})
		const secondVideo = makeVideo({
			id: "018f4f52-6f58-7cb3-8f9e-444444444444",
			externalId: "kJQP7kiw5Fk",
		})
		const firstInfo = makeVideoInfo({
			id: "018f4f52-6f58-7cb3-8f9e-555555555555",
			videoId: firstVideo.id,
			fulltitle: "First",
		})

		jest.mocked(videoRepo.findPage).mockResolvedValue({
			items: [firstVideo, secondVideo],
			rowCount: 2,
		})
		jest.mocked(videoInfoRepo.findByVideoIds).mockResolvedValue([firstInfo])

		const result = await service.list(baseQuery)

		expect(videoInfoRepo.findByVideoIds).toHaveBeenCalledWith([
			firstVideo.id,
			secondVideo.id,
		])
		expect(result).toEqual({
			items: [
				{ ...firstVideo, info: firstInfo },
				{ ...secondVideo, info: null },
			],
			rowCount: 2,
		})
	})

	it("sets info to null when info is missing", async () => {
		const { service, videoRepo, videoInfoRepo } = createService()
		const video = makeVideo({
			id: "018f4f52-6f58-7cb3-8f9e-666666666666",
		})

		jest.mocked(videoRepo.findPage).mockResolvedValue({
			items: [video],
			rowCount: 1,
		})
		jest.mocked(videoInfoRepo.findByVideoIds).mockResolvedValue([])

		const result = await service.list(baseQuery)

		expect(result).toEqual({
			items: [{ ...video, info: null }],
			rowCount: 1,
		})
	})

	it("passes query to repo without modification", async () => {
		const { service, videoRepo, videoInfoRepo } = createService()
		const query = Object.freeze({
			pageIndex: 2,
			pageSize: 10,
			sortBy: "channelTitle",
			sortDir: "asc",
			status: "done",
			q: "channel",
		}) as ListVideosQuery

		jest.mocked(videoRepo.findPage).mockResolvedValue({
			items: [],
			rowCount: 0,
		})
		jest.mocked(videoInfoRepo.findByVideoIds).mockResolvedValue([])

		await service.list(query)

		expect(videoRepo.findPage).toHaveBeenCalledTimes(1)
		expect(videoRepo.findPage.mock.calls[0]?.[0]).toBe(query)
	})
})
