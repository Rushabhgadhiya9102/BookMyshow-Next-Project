import { Controller, Get, Query } from "@nestjs/common";
import { Public } from "@/common/decorators/public.decorator";
import { SearchService } from "./search.service";

@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * Section 88 & 89: Public multi-entity search endpoint
   */
  @Public()
  @Get()
  async search(@Query("q") query: string) {
    const data = await this.searchService.search(query);
    return {
      success: true,
      data,
    };
  }
}
