import { Repository, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual, ILike, Between } from 'typeorm';
import { AppDataSource } from '../config/database';
import { OrderNote } from '../entities/OrderNote';
import { Order } from '../entities/Order';
import { logger } from '../utils/logger';

export interface CreateNoteDto {
  orderId: string;
  content: string;
  isPrivate: boolean;
  createdBy: string;
}

export interface UpdateNoteDto {
  content?: string;
  isPrivate?: boolean;
  updatedBy: string;
}

export interface NoteFilters {
  isInternal?: boolean;
  startDate?: Date;
  endDate?: Date;
  adminId?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

export class NoteService {
  private noteRepository: Repository<OrderNote>;
  private orderRepository: Repository<Order>;

  constructor() {
    this.noteRepository = AppDataSource.getRepository(OrderNote);
    this.orderRepository = AppDataSource.getRepository(Order);
  }

  /**
   * Create a new note for an order
   */
  async createNote(data: CreateNoteDto): Promise<OrderNote> {
    try {
      // Verify order exists
      const order = await this.orderRepository.findOneBy({ id: data.orderId });
      if (!order) {
        throw new Error('Order not found');
      }

      const note = this.noteRepository.create({
        orderId: data.orderId,
        content: data.content,
        isPrivate: data.isPrivate,
        createdBy: data.createdBy,
      });

      const savedNote = await this.noteRepository.save(note);
      return savedNote;
    } catch (error) {
      logger.error('Error creating note:', error);
      throw error;
    }
  }

  /**
   * Get all notes for an order
   */
  async getNotesByOrderId(orderId: string): Promise<OrderNote[]> {
    try {
      const notes = await this.noteRepository.find({
        where: { orderId },
        order: { createdAt: 'DESC' }
      });

      return notes;
    } catch (error) {
      logger.error('Error getting notes:', error);
      throw error;
    }
  }

  /**
   * Update a note
   */
  async updateNote(noteId: string, data: UpdateNoteDto): Promise<OrderNote> {
    try {
      const note = await this.noteRepository.findOneBy({ id: noteId });
      if (!note) {
        throw new Error('Note not found');
      }

      if (data.content !== undefined) {
        note.content = data.content;
      }
      if (data.isPrivate !== undefined) {
        note.isPrivate = data.isPrivate;
      }
      note.updatedBy = data.updatedBy;

      const updatedNote = await this.noteRepository.save(note);
      return updatedNote;
    } catch (error) {
      logger.error('Error updating note:', error);
      throw error;
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<void> {
    try {
      const note = await this.noteRepository.findOneBy({ id: noteId });
      if (!note) {
        throw new Error('Note not found');
      }

      await this.noteRepository.remove(note);
    } catch (error) {
      logger.error('Error deleting note:', error);
      throw error;
    }
  }

  /**
   * Get note by ID
   */
  async getNoteById(id: string): Promise<OrderNote | null> {
    try {
      const note = await this.noteRepository.findOne({
        where: { id },
        relations: ['order'],
      });
      return note;
    } catch (error) {
      logger.error(`Failed to get note ${id}:`, error);
      throw new Error('Failed to get note');
    }
  }

  /**
   * Get notes for an order with filters and pagination
   */
  async getOrderNotes(
    orderId: string,
    filters: NoteFilters = {},
    pagination: PaginationOptions
  ): Promise<[OrderNote[], number]> {
    try {
      const where: FindOptionsWhere<OrderNote> = { orderId };

      // Apply filters
      if (filters.isInternal !== undefined) {
        where.isInternal = filters.isInternal;
      }

      if (filters.adminId) {
        where.adminId = filters.adminId;
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = filters.startDate && filters.endDate
          ? Between(filters.startDate, filters.endDate)
          : filters.startDate
          ? MoreThanOrEqual(filters.startDate)
          : LessThanOrEqual(filters.endDate!);
      }

      const [notes, total] = await this.noteRepository.findAndCount({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        order: {
          [pagination.sortBy || 'createdAt']: pagination.order || 'DESC',
        },
      });

      return [notes, total];
    } catch (error) {
      logger.error(`Failed to get notes for order ${orderId}:`, error);
      throw new Error('Failed to get order notes');
    }
  }

  /**
   * Get admin's recent notes across all orders
   */
  async getAdminRecentNotes(
    adminId: string,
    pagination: PaginationOptions
  ): Promise<[OrderNote[], number]> {
    try {
      const [notes, total] = await this.noteRepository.findAndCount({
        where: { adminId },
        relations: ['order'],
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        order: {
          createdAt: 'DESC',
        },
      });

      return [notes, total];
    } catch (error) {
      logger.error(`Failed to get recent notes for admin ${adminId}:`, error);
      throw new Error('Failed to get admin notes');
    }
  }

  /**
   * Search notes by content
   */
  async searchNotes(
    searchTerm: string,
    filters: NoteFilters = {},
    pagination: PaginationOptions
  ): Promise<[OrderNote[], number]> {
    try {
      const where: FindOptionsWhere<OrderNote> = {
        content: searchTerm ? ILike(`%${searchTerm}%`) : undefined,
      };

      if (filters.isInternal !== undefined) {
        where.isInternal = filters.isInternal;
      }

      if (filters.adminId) {
        where.adminId = filters.adminId;
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = filters.startDate && filters.endDate
          ? Between(filters.startDate, filters.endDate)
          : filters.startDate
          ? MoreThanOrEqual(filters.startDate)
          : LessThanOrEqual(filters.endDate!);
      }

      const [notes, total] = await this.noteRepository.findAndCount({
        where,
        relations: ['order'],
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        order: {
          createdAt: 'DESC',
        },
      });

      return [notes, total];
    } catch (error) {
      logger.error('Failed to search notes:', error);
      throw new Error('Failed to search notes');
    }
  }
} 