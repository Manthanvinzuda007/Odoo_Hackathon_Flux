import { Global, Module } from '@nestjs/common';
import { SequenceService } from './services/sequence.service';
import { AuditService } from './services/audit.service';

@Global()
@Module({
  providers: [SequenceService, AuditService],
  exports: [SequenceService, AuditService],
})
export class CommonModule {}
