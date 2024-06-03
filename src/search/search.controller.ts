// src/search/search.controller.ts
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { SearchResultDto } from './dto/search-result.dto';
import { SearchService } from './search.service';
import { CacheTTL } from '@nestjs/cache-manager';
import { GetCandlesDto, GetCandlesResultDto } from './dto';

@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('search')
  @CacheTTL(60)
  async search(@Query('query') query: string): Promise<SearchResultDto[]> {
    if (!query) return [];
    return this.searchService.search(query);
  }

  @Post('candles')
  @CacheTTL(60)
  load(@Body() request: GetCandlesDto): Promise<GetCandlesResultDto | null> {
    return this.searchService.candles(request);
  }
}
