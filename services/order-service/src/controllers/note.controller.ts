import { FastifyRequest, FastifyReply } from 'fastify';
import { NoteService } from '../services/note.service';
import { logger } from '../utils/logger';
import { OrderNote } from '../entities/OrderNote';

interface CreateNoteBody {
  content: string;
  isPrivate?: boolean;
}

interface UpdateNoteBody {
  content: string;
  isPrivate?: boolean;
}

interface RequestParams {
  orderId: string;
  noteId?: string;
}

export class NoteController {
  private noteService: NoteService;

  constructor() {
    this.noteService = new NoteService();
  }

  private getUserFromRequest(request: FastifyRequest): { id: string; roles?: string[] } {
    const user = request.user as unknown as { id: string; roles?: string[] };
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    return user;
  }

  /**
   * Add a note to an order
   */
  async addNote(
    request: FastifyRequest<{
      Body: CreateNoteBody;
      Params: RequestParams;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { orderId } = request.params;
      const { content, isPrivate = false } = request.body;
      const user = this.getUserFromRequest(request);

      // Verify admin role
      if (!user.roles?.includes('admin')) {
        return reply.status(403).send({ message: 'Only admins can add notes' });
      }

      const note = await this.noteService.createNote({
        orderId,
        content,
        isPrivate,
        createdBy: user.id
      });

      logger.info(`Added note to order ${orderId} by admin ${user.id}`);
      return reply.status(201).send(note);
    } catch (error) {
      logger.error('Failed to add note:', error);
      return reply.status(500).send({ message: 'Failed to add note' });
    }
  }

  /**
   * Get all notes for an order
   */
  async getNotes(
    request: FastifyRequest<{
      Params: RequestParams;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { orderId } = request.params;
      const user = this.getUserFromRequest(request);
      const isAdmin = user.roles?.includes('admin');

      const notes = await this.noteService.getNotesByOrderId(orderId);

      // Filter out private notes for non-admin users
      const filteredNotes = isAdmin 
        ? notes 
        : notes.filter((note: OrderNote) => !note.isPrivate);

      return reply.send(filteredNotes);
    } catch (error) {
      logger.error('Failed to get notes:', error);
      return reply.status(500).send({ message: 'Failed to get notes' });
    }
  }

  /**
   * Update a note
   */
  async updateNote(
    request: FastifyRequest<{
      Body: UpdateNoteBody;
      Params: RequestParams;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { orderId, noteId } = request.params;
      const { content, isPrivate } = request.body;
      const user = this.getUserFromRequest(request);

      if (!noteId) {
        return reply.status(400).send({ message: 'Note ID is required' });
      }

      // Verify admin role
      if (!user.roles?.includes('admin')) {
        return reply.status(403).send({ message: 'Only admins can update notes' });
      }

      const note = await this.noteService.updateNote(noteId, {
        content,
        isPrivate,
        updatedBy: user.id
      });

      if (!note) {
        return reply.status(404).send({ message: 'Note not found' });
      }

      logger.info(`Updated note ${noteId} for order ${orderId} by admin ${user.id}`);
      return reply.send(note);
    } catch (error) {
      logger.error('Failed to update note:', error);
      return reply.status(500).send({ message: 'Failed to update note' });
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(
    request: FastifyRequest<{
      Params: RequestParams;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { orderId, noteId } = request.params;
      const user = this.getUserFromRequest(request);

      if (!noteId) {
        return reply.status(400).send({ message: 'Note ID is required' });
      }

      // Verify admin role
      if (!user.roles?.includes('admin')) {
        return reply.status(403).send({ message: 'Only admins can delete notes' });
      }

      await this.noteService.deleteNote(noteId);
      
      logger.info(`Deleted note ${noteId} from order ${orderId} by admin ${user.id}`);
      return reply.status(204).send();
    } catch (error) {
      logger.error('Failed to delete note:', error);
      return reply.status(500).send({ message: 'Failed to delete note' });
    }
  }
} 