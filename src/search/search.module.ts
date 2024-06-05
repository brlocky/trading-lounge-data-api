import { Module, DynamicModule } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchProvider } from './search-provider.interface';
import { SearchController } from './search.controller';

@Module({
  controllers: [SearchController],
})
export class SearchModule {
  static register(providersArray: any[]): DynamicModule {
    return {
      module: SearchModule,
      providers: [
        ...providersArray,
        {
          provide: 'SEARCH_PROVIDERS',
          useFactory: (...args: SearchProvider[]) => args,
          inject: providersArray,
        },
        SearchService,
      ],
      exports: [SearchService],
    };
  }
}
