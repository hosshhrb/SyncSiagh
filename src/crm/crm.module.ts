import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CrmAuthService } from './crm-auth.service';
import { CrmApiClient } from './crm-api.client';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  providers: [CrmAuthService, CrmApiClient],
  exports: [CrmAuthService, CrmApiClient],
})
export class CrmModule {}

