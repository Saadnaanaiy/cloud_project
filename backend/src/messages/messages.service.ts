import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { User } from '../auth/user.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async saveMessage(senderId: number, receiverId: number, content: string, replyToId?: number): Promise<Message> {
    const message = this.messagesRepository.create({
      senderId,
      receiverId,
      content,
      isRead: false,
      replyToId,
    });
    const saved = await this.messagesRepository.save(message);
    if (replyToId) {
      return await this.messagesRepository.findOne({
        where: { id: saved.id },
        relations: ['replyTo'],
      }) || saved;
    }
    return saved;
  }

  async getConversation(userId1: number, userId2: number): Promise<Message[]> {
    return await this.messagesRepository.find({
      where: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
      relations: ['replyTo'],
      order: { createdAt: 'ASC' },
    });
  }

  async getContacts(userId: number, role?: string): Promise<any[]> {
    // This is a simplified query. In a real app, you'd want the latest message per contact.
    // We'll fetch all messages for the user, then group by contact to find unique contacts.
    const messages = await this.messagesRepository.find({
      where: [
        { senderId: userId },
        { receiverId: userId },
      ],
      relations: ['sender', 'receiver'],
      order: { createdAt: 'DESC' },
    });

    const contactsMap = new Map<number, any>();

    for (const msg of messages) {
      const contactId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!contactsMap.has(contactId)) {
        const contactUser = msg.senderId === userId ? msg.receiver : msg.sender;
        if (contactUser) {
          contactsMap.set(contactId, {
            user: {
              id: contactUser.id,
              name: contactUser.name,
              email: contactUser.email,
              role: contactUser.role,
            },
            lastMessage: msg,
            unreadCount: 0, // We will calculate this next
          });
        }
      }
      
      // Calculate unread count (if the message was sent TO the current user and is unread)
      if (msg.receiverId === userId && !msg.isRead) {
        const contactData = contactsMap.get(contactId);
        if (contactData) {
          contactData.unreadCount += 1;
        }
      }
    }

    // If the user is admin or HR, they should see everyone in the system so they can start a chat
    if (role === 'ADMIN' || role === 'HR' || role === 'MANAGER' || role === 'admin' || role === 'hr' || role === 'manager') {
      const allUsers = await this.usersRepository.find();
      for (const u of allUsers) {
        if (u.id !== userId && !contactsMap.has(u.id)) {
          contactsMap.set(u.id, {
            user: {
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
            },
            lastMessage: null,
            unreadCount: 0,
          });
        }
      }
    }

    return Array.from(contactsMap.values());
  }

  async markAsRead(senderId: number, receiverId: number): Promise<void> {
    // Mark all messages sent by senderId to receiverId as read
    await this.messagesRepository.update(
      { senderId, receiverId, isRead: false },
      { isRead: true }
    );
  }
}
