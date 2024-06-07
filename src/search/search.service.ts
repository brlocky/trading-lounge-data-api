import { Injectable, Inject } from '@nestjs/common';
import { SearchProvider } from './search-provider.interface';
import { GetCandlesDto, GetCandlesResultDto, GetQuoteDto, GetQuoteResultDto, SearchResultDto } from './dto';

@Injectable()
export class SearchService {
  private searchProviders: SearchProvider[];

  constructor(@Inject('SEARCH_PROVIDERS') searchProviders: SearchProvider[]) {
    this.searchProviders = searchProviders;
  }

  async search(query: string): Promise<SearchResultDto[]> {
    const searchPromises = this.searchProviders.map((provider) => provider.search(query));
    const results = await Promise.all(searchPromises);
    return results.flat();
  }

  async candles(request: GetCandlesDto): Promise<GetCandlesResultDto | null> {
    // TODO add search provider identifier to request
    const dataProvider = this.searchProviders.find((s) => s.getIdentifier() === 'TV')!;
    return dataProvider.getCandles(request);
  }

  async quotes(request: GetQuoteDto): Promise<GetQuoteResultDto> {
    // TODO add search provider identifier to request
    const dataProvider = this.searchProviders.find((s) => s.getIdentifier() === 'TV')!;
    return dataProvider.getQuote(request);
  }
}
