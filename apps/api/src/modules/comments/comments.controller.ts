import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { Public } from "@/common/decorators/public.decorator";

@Controller("comments")
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * Public: Anyone can read movie reviews
   */
  @Public()
  @Get(":movieId")
  async findByMovieId(@Param("movieId") movieId: string) {
    return this.commentsService.findByMovieId(movieId);
  }

  /**
   * Protected: Section 90 verified review submission
   */
  @Post()
  async create(
    @Body()
    body: {
      movieId: string;
      userId?: string;
      username?: string;
      comment: string;
      rating?: number;
    },
    @Req() req: any
  ) {
    const userId = body.userId || req.user?.id || req.user?.userId;
    return this.commentsService.create({
      ...body,
      userId,
      username: body.username || req.user?.username,
    });
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() body: { comment: string }
  ) {
    return this.commentsService.update(id, body.comment);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.commentsService.remove(id);
  }
}
