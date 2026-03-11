import { Injectable, Logger } from "@nestjs/common"
import { AppConfigService } from "../app-config/app-config.service"

@Injectable()
export class RevalidationService {
	private readonly logger = new Logger(RevalidationService.name)

	constructor(private readonly appConfig: AppConfigService) {}

	async revalidateTags(tags: string[]) {
		try {
			const webHost =
				this.appConfig.get("WEB_HOST_INTERNAL") ??
				this.appConfig.get("WEB_HOST")
			const adminKey = this.appConfig.get("ADMIN_SECRET_KEY")

			const response = await fetch(`${webHost}/api/revalidate`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-admin-key": adminKey,
				},
				body: JSON.stringify({ tags }),
			})

			if (!response.ok) {
				this.logger.error(
					`Revalidation failed: ${response.status} ${response.statusText}`
				)
			}
		} catch (error) {
			this.logger.error("Revalidation request failed", error)
		}
	}
}
