import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";

@WebSocketGateway({
  namespace: "/seats",
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000",
      process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001",
    ].filter(Boolean),
    credentials: true,
  },
})
export class SeatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SeatsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to /seats: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from /seats: ${client.id}`);
  }

  @SubscribeMessage("join_show")
  handleJoinShow(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { showId: string }
  ) {
    if (payload?.showId) {
      const room = `show:${payload.showId}`;
      client.join(room);
      this.logger.log(`Client ${client.id} joined room ${room}`);
      return { event: "joined_show", data: { room } };
    }
  }

  @SubscribeMessage("leave_show")
  handleLeaveShow(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { showId: string }
  ) {
    if (payload?.showId) {
      const room = `show:${payload.showId}`;
      client.leave(room);
      this.logger.log(`Client ${client.id} left room ${room}`);
      return { event: "left_show", data: { room } };
    }
  }

  /**
   * Broadcast seat hold event (Section 82 & 83)
   */
  broadcastSeatHeld(showId: string, seatIds: string[], expiresAt: Date) {
    if (!this.server) return;
    const room = `show:${showId}`;
    this.server.to(room).emit("SEAT_HELD", {
      showId,
      seatIds,
      expiresAt: expiresAt.toISOString(),
    });
  }

  /**
   * Broadcast seat release event (Section 82 & 83)
   */
  broadcastSeatReleased(showId: string, seatIds: string[]) {
    if (!this.server) return;
    const room = `show:${showId}`;
    this.server.to(room).emit("SEAT_RELEASED", {
      showId,
      seatIds,
    });
  }

  /**
   * Broadcast seat booked event (Section 82 & 83)
   */
  broadcastSeatBooked(showId: string, seatIds: string[]) {
    if (!this.server) return;
    const room = `show:${showId}`;
    this.server.to(room).emit("SEAT_BOOKED", {
      showId,
      seatIds,
    });
  }

  /**
   * Broadcast show update event
   */
  broadcastShowUpdated(showId: string) {
    if (!this.server) return;
    const room = `show:${showId}`;
    this.server.to(room).emit("SHOW_UPDATED", {
      showId,
    });
  }
}
