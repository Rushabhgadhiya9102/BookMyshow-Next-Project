import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { MoviesModule } from "./modules/movies/movies.module";
import { TheatersModule } from "./modules/theaters/theaters.module";
import { ShowsModule } from "./modules/shows/shows.module";
import { SeatsModule } from "./modules/seats/seats.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { TicketsModule } from "./modules/tickets/tickets.module";
import { CommentsModule } from "./modules/comments/comments.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { AccountModule } from "./modules/account/account.module";
import { AdminModule } from "./modules/admin/admin.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { SearchModule } from "./modules/search/search.module";
import { HealthModule } from "./modules/health/health.module";
import { PricingModule } from "./modules/pricing/pricing.module";
import { EventsModule } from "./modules/events/events.module";
import { MetricsModule } from "./modules/metrics/metrics.module";
import { StructuredLoggerService } from "./common/services/structured-logger.service";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { CorrelationIdMiddleware } from "./common/middleware/correlation-id.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    PrismaModule,
    AuthModule,
    AccountModule,
    MoviesModule,
    TheatersModule,
    ShowsModule,
    SeatsModule,
    BookingsModule,
    PaymentsModule,
    TicketsModule,
    CommentsModule,
    UploadsModule,
    AdminModule,
    NotificationsModule,
    SearchModule,
    HealthModule,
    PricingModule,
    EventsModule,
    MetricsModule,
  ],
  providers: [
    StructuredLoggerService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes("*");
  }
}
