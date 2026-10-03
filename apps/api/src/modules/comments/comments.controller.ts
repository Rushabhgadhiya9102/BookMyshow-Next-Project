import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { Public } from "@/common/decorators/public.decorator";

@Controller("comments")
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Public()
  @Get(":movieId")
  async findByMovieId(@Param("movieId") movieId: string) {
    return this.commentsService.findByMovieId(movieId);
  }

  @Public()
  @Post()
  async create(
    @Body()
    body: {
      movieId: string;
      userId: string;
      username?: string;
      comment: string;
      rating?: number;
    }
  ) {
    return this.commentsService.create(body);
  }

  @Public()
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() body: { comment: string }
  ) {
    return this.commentsService.update(id, body.comment);
  }

  @Public()
  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.commentsService.remove(id);
  }
}
