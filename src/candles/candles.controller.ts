import { Controller, Post, Body } from '@nestjs/common';
import { DataService } from 'src/services';
import { GetCandlesDto, GetCandlesResultDto } from 'src/dto';

@Controller('candles')
export class CandlesController {
  constructor(private readonly service: DataService) {}

  @Post()
  load(@Body() getCandlesDto: GetCandlesDto): Promise<GetCandlesResultDto> {
    return this.service.getCandles(getCandlesDto);
  }
}
