import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Post,
} from "@nestjs/common"
import { ApiOkResponse } from "@nestjs/swagger"
import { CreateVideoDto } from "./dto/create-video.dto"
import { CreateVideoResponseDto } from "./dto/create-video-response.dto"
import { VideoArticleResponseDto } from "./dto/video-article-response.dto"
import { VideoIdDto } from "./dto/video-id.dto"
import { VideoResponseDto } from "./dto/video-response.dto"
import { VideoStatusResponseDto } from "./dto/video-status-response.dto"
import { VideoService } from "./video.service"

@Controller("video")
export class VideoController {
	constructor(private readonly videoService: VideoService) {}

	@Post()
	@HttpCode(HttpStatus.OK)
	@ApiOkResponse({ type: CreateVideoResponseDto })
	create(@Body() dto: CreateVideoDto) {
		return this.videoService.create(dto)
	}

	@Get(":id/status")
	@ApiOkResponse({ type: VideoStatusResponseDto })
	async status(@Param() { id }: VideoIdDto) {
		const result = await this.videoService.status(id)
		if (!result) {
			throw new NotFoundException()
		}

		return result
	}

	@Get(":id/article")
	@ApiOkResponse({ type: VideoArticleResponseDto })
	async getArticle(@Param() { id }: VideoIdDto) {
		const result = await this.videoService.getArticle(id)
		if (!result) {
			throw new NotFoundException()
		}

		return result
	}

	@Get(":id")
	@ApiOkResponse({ type: VideoResponseDto })
	async findOne(@Param() { id }: VideoIdDto) {
		const result = await this.videoService.findOne(id)
		if (!result) {
			throw new NotFoundException()
		}

		return result
	}
}
