import { Injectable, Inject } from '@nestjs/common';
import { SearchProvider } from './search-provider.interface';
import { SearchResultDto } from './dto/search-result.dto';

@Injectable()
export class DataService {
  private searchProviders: SearchProvider[];

  constructor(@Inject('SEARCH_PROVIDERS') searchProviders: SearchProvider[]) {
    this.searchProviders = searchProviders;
  }

  async search(query: string): Promise<SearchResultDto[]> {
    const searchPromises = this.searchProviders.map((provider) => provider.search(query));
    const results = await Promise.all(searchPromises);

    return results.flat();
  }
}
