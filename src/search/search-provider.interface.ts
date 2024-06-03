import { SearchResultDto, GetCandlesDto, GetCandlesResultDto } from './dto';

export interface SearchProvider {
  search(query: string): Promise<SearchResultDto[]>;
  getCandles(request: GetCandlesDto): Promise<GetCandlesResultDto | null>;
  getIdentifier(): string;
}
