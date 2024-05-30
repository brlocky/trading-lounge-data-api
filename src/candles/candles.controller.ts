import { CacheTTL } from '@nestjs/cache-manager';
import { Body, Controller, Post } from '@nestjs/common';
import { GetCandlesDto, GetCandlesResultDto, SearchDto, SearchResultDto } from 'src/dto';
import { DataService } from 'src/services';

@Controller()
export class CandlesController {
  constructor(private readonly service: DataService) {}

  @Post('candles')
  @CacheTTL(5)
  load(@Body() getCandlesDto: GetCandlesDto): Promise<GetCandlesResultDto> {
    return this.service.getCandles(getCandlesDto);
  }

  @Post('Search')
  @CacheTTL(5)
  search(@Body() executeSearchDto: SearchDto): Promise<SearchResultDto[]> {
    return this.service.search(executeSearchDto);
  }
}
