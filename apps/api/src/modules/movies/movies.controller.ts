import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  Query,
} from "@nestjs/common";
import { Request } from "express";
import { JwtService } from "@nestjs/jwt";
import { MoviesService } from "./movies.service";
import { CreateMovieDto } from "./dto/create-movie.dto";
import { UpdateMovieDto } from "./dto/update-movie.dto";
import { Public } from "@/common/decorators/public.decorator";

@Controller("movies")
export class MoviesController {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly jwtService: JwtService
  ) {}

  @Public()
  @Get()
  async findAll(
    @Req() req: Request,
    @Query("city") city?: string,
    @Query("status") status?: string,
    @Query("language") language?: string
  ) {
    let adminId: string | undefined;

    const authHeader = req.headers.authorization;
    const cookieToken =
      req.cookies?.token ||
      (req.headers.cookie && req.headers.cookie.match(/(?:^|;\s*)token=([^;]+)/)?.[1]);

    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : cookieToken;

    if (token) {
      try {
        const payload: any = this.jwtService.decode(token);
        if (payload?.role === "admin") {
          adminId = payload.id;
        }
      } catch {
        // Ignore invalid token on public listing
      }
    }

    const movieData = await this.moviesService.findAll(adminId, city, status, language);
    return {
      message: "movie fetch sucessfull",
      movieData,
      status: 200,
    };
  }

  @Public()
  @Get(":id")
  async findOne(@Param("id") id: string) {
    const movieById = await this.moviesService.findOne(id);
    return {
      movieById,
      status: 200,
    };
  }

  @Public()
  @Post()
  async create(@Body() dto: CreateMovieDto, @Req() req: Request) {
    const cookieToken =
      req.cookies?.token ||
      (req.headers.cookie && req.headers.cookie.match(/(?:^|;\s*)token=([^;]+)/)?.[1]);
    let adminId: string | undefined;
    if (cookieToken) {
      try {
        const payload: any = this.jwtService.decode(cookieToken);
        adminId = payload?.id;
      } catch {
        // fallback
      }
    }

    const movie = await this.moviesService.create(dto, adminId);
    return {
      message: "movie created successfully",
      movie,
      status: 201,
    };
  }

  @Public()
  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateMovieDto) {
    const updatedData = await this.moviesService.update(id, dto);
    return {
      message: "movie updated successfully",
      updatedData,
      status: 200,
    };
  }

  @Public()
  @Delete(":id")
  async remove(@Param("id") id: string) {
    const result = await this.moviesService.remove(id);
    return {
      ...result,
      message: "movie deleted successfully",
      status: 200,
    };
  }
}
