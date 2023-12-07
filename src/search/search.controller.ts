import { Controller, Post, Body } from '@nestjs/common';
import { SearchDto } from '../dto/search.dto';
import { DataService } from 'src/services';
import { SearchResultDto } from 'src/dto';

@Controller('search')
export class SearchController {
  constructor(private readonly service: DataService) {}

  @Post()
  search(@Body() executeSearchDto: SearchDto): Promise<SearchResultDto[]> {
    return this.service.search(executeSearchDto);
  }
}
