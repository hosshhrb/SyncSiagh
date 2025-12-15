import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FinanceAuthService } from './finance-auth.service';
import { FinanceApiClient } from './finance-api.client';
import { SiaghApiClient } from './siagh-api.client';
import { FinanceSiaghAdapter } from './finance-siagh.adapter';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  providers: [FinanceAuthService, FinanceApiClient, SiaghApiClient, FinanceSiaghAdapter],
  exports: [FinanceAuthService, FinanceApiClient, SiaghApiClient, FinanceSiaghAdapter],
})
export class FinanceModule {}

