import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, replace with frontend URL
  },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map to keep track of connected users: userId -> socketId
  private connectedUsers = new Map<number, string>();

  constructor(
    private messagesService: MessagesService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers['authorization']?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }
      const secret = this.configService.get<string>('JWT_SECRET', 'employee_secret_key_2026');
      const payload = this.jwtService.verify(token, { secret });
      const userId = payload.sub;
      client.data = { userId, role: payload.role };
      
      this.connectedUsers.set(userId, client.id);
      
      // Optionally broadcast that user is online
      this.server.emit('userStatus', { userId, status: 'online' });
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    let disconnectedUserId: number | null = null;
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        disconnectedUserId = userId;
        this.connectedUsers.delete(userId);
        break;
      }
    }
    
    if (disconnectedUserId) {
      this.server.emit('userStatus', { userId: disconnectedUserId, status: 'offline' });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { receiverId: number; content: string; replyToId?: number },
  ) {
    let senderId: number | undefined;
    // Find senderId from socket id
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        senderId = userId;
        break;
      }
    }

    if (!senderId) return;

    // Allow admin, hr, manager, and employee
    const role = (client.data.role || '').toLowerCase();
    const allowedRoles = ['admin', 'hr', 'manager', 'employee'];
    if (!allowedRoles.includes(role)) {
      return;
    }

    // Save message to DB
    const savedMessage = await this.messagesService.saveMessage(
      senderId,
      payload.receiverId,
      payload.content,
      payload.replyToId,
    );

    // Emit back to sender (for confirmation/local update)
    client.emit('newMessage', savedMessage);

    // If receiver is connected, emit to them
    const receiverSocketId = this.connectedUsers.get(payload.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('newMessage', savedMessage);
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { receiverId: number; isTyping: boolean },
  ) {
    let senderId: number | undefined;
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        senderId = userId;
        break;
      }
    }
    if (!senderId) return;

    // Allow admin, hr, manager, and employee
    const role = (client.data.role || '').toLowerCase();
    const allowedRoles = ['admin', 'hr', 'manager', 'employee'];
    if (!allowedRoles.includes(role)) {
      return;
    }

    const receiverSocketId = this.connectedUsers.get(payload.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('userTyping', {
        senderId,
        isTyping: payload.isTyping,
      });
    }
  }
}
