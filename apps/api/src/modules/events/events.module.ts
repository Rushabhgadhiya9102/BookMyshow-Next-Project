import { Module, Global } from "@nestjs/common";
import { EventsService } from "./events.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Global()
@Module({
  imports: [NotificationsModule],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
