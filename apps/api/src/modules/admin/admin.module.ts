import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { FinancialReconciliationService } from "./reconciliation.service";
import { SupportLookupService } from "./support-lookup.service";

@Module({
  controllers: [AdminController],
  providers: [
    AdminService,
    FinancialReconciliationService,
    SupportLookupService,
  ],
  exports: [
    AdminService,
    FinancialReconciliationService,
    SupportLookupService,
  ],
})
export class AdminModule {}
