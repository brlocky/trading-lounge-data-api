import { CacheTTL } from '@nestjs/cache-manager';
import { Body, Controller, Post } from '@nestjs/common';
import { GetCandlesDto, GetCandlesResultDto } from 'src/dto';
import { DataService } from 'src/services';

@Controller('candles')
export class CandlesController {
  constructor(private readonly service: DataService) {}

  @Post()
  @CacheTTL(5)
  load(@Body() getCandlesDto: GetCandlesDto): Promise<GetCandlesResultDto> {
    return this.service.getCandles(getCandlesDto);
  }
}
