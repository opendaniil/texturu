import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Post,
	Query,
} from "@nestjs/common"
import { ApiOkResponse } from "@nestjs/swagger"
import { VideoService } from "../../application/video.service"
import { CreateVideoDto } from "./dto/create-video.dto"
import { CreateVideoResponseDto } from "./dto/create-video-response.dto"
import { LatestVideoArticlesQueryDto } from "./dto/latest-video-articles-query.dto"
import { LatestVideoArticlesResponseDto } from "./dto/latest-video-articles-response.dto"
import { ListVideosQueryDto } from "./dto/list-videos-query.dto"
import { ListVideosResponseDto } from "./dto/list-videos-response.dto"
import { VideoArticleResponseDto } from "./dto/video-article-response.dto"
import { VideoIdDto } from "./dto/video-id.dto"
import { VideoResponseDto } from "./dto/video-response.dto"
import { VideoStatusResponseDto } from "./dto/video-status-response.dto"

@Controller("video")
export class VideoController {
	constructor(private readonly videoService: VideoService) {}

	@Post()
	@HttpCode(HttpStatus.OK)
	@ApiOkResponse({ type: CreateVideoResponseDto })
	create(@Body() dto: CreateVideoDto) {
		return this.videoService.create(dto)
	}

	@Get()
	@ApiOkResponse({ type: ListVideosResponseDto })
	list(@Query() query: ListVideosQueryDto) {
		return this.videoService.list(query)
	}

	@Get("articles/latest")
	@ApiOkResponse({ type: LatestVideoArticlesResponseDto })
	latestArticles(@Query() query: LatestVideoArticlesQueryDto) {
		return this.videoService.latestArticles(query)
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
