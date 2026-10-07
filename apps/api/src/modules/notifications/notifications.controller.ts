import { Controller, Get, Patch, Param, Req } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Section 86: Retrieve in-app notifications for authenticated user
   */
  @Get()
  getNotifications(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    const notifications = this.notificationsService.getUserNotifications(userId);
    return {
      success: true,
      data: notifications,
    };
  }

  /**
   * Section 86: Mark notification as read
   */
  @Patch(":id/read")
  markAsRead(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    const updated = this.notificationsService.markAsRead(id, userId);
    return {
      success: true,
      updated,
    };
  }
}
