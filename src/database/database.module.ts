import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { EntityMappingRepository } from './repositories/entity-mapping.repository';
import { SyncLogRepository } from './repositories/sync-log.repository';

@Global()
@Module({
  providers: [PrismaService, EntityMappingRepository, SyncLogRepository],
  exports: [PrismaService, EntityMappingRepository, SyncLogRepository],
})
export class DatabaseModule {}

