import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { GetCandlesDto, GetCandlesResultDto, GetQuoteDto, GetQuoteResultDto } from './dto';
import { SearchResultDto } from './dto/search-result.dto';
import { SearchService } from './search.service';

@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('search')
  async search(@Query('query') query: string): Promise<SearchResultDto[]> {
    return this.searchService.search(query);
  }

  @Get('candles')
  candles(@Query() request: GetCandlesDto): Promise<GetCandlesResultDto | null> {
    return this.searchService.candles(request);
  }

  @Post('quotes')
  quotes(@Body() request: GetQuoteDto): Promise<GetQuoteResultDto> {
    return this.searchService.quotes(request);
  }
}
