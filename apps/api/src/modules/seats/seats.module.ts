import { Module } from "@nestjs/common";
import { SeatsService } from "./seats.service";
import { SeatsController } from "./seats.controller";
import { SeatsGateway } from "./seats.gateway";

@Module({
  controllers: [SeatsController],
  providers: [SeatsService, SeatsGateway],
  exports: [SeatsService, SeatsGateway],
})
export class SeatsModule {}
