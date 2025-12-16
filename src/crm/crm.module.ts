import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CrmAuthService } from './crm-auth.service';
import { CrmApiClient } from './crm-api.client';
import { CrmIdentityApiClient } from './crm-identity-api.client';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  providers: [CrmAuthService, CrmApiClient, CrmIdentityApiClient],
  exports: [CrmAuthService, CrmApiClient, CrmIdentityApiClient],
})
export class CrmModule {}

