import { Controller, Get } from '@nestjs/common';
import { StatsService } from './stats.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('latest')
  @ApiOperation({ summary: 'Obtém as estatísticas mais recentes de impacto' })
  getLatest() {
    return this.statsService.getLatestStats();
  }
}
