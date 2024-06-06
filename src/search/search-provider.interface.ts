import { SearchResultDto, GetCandlesDto, GetCandlesResultDto, GetQuoteDto, GetQuoteResultDto } from './dto';

export interface SearchProvider {
  search(query: string): Promise<SearchResultDto[]>;
  getCandles(request: GetCandlesDto): Promise<GetCandlesResultDto | null>;
  getIdentifier(): string;
  getQuote(request: GetQuoteDto): Promise<GetQuoteResultDto>;
}
