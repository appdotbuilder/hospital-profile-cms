import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactMessagesTable } from '../db/schema';
import { 
  type CreateContactMessageInput,
  type UpdateContactMessageInput,
  type PaginationInput,
  type GetByIdInput,
  type DeleteByIdInput
} from '../schema';
import {
  createContactMessage,
  getContactMessages,
  getContactMessageById,
  markContactMessageAsRead,
  deleteContactMessage
} from '../handlers/contact_messages';
import { eq } from 'drizzle-orm';

const testContactInput: CreateContactMessageInput = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  subject: 'Inquiry about services',
  message: 'I would like to know more about your medical services.'
};

const testContactInput2: CreateContactMessageInput = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '+0987654321',
  subject: 'Appointment request',
  message: 'I would like to schedule an appointment with a cardiologist.'
};

describe('createContactMessage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a contact message', async () => {
    const result = await createContactMessage(testContactInput);

    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john@example.com');
    expect(result.phone).toEqual('+1234567890');
    expect(result.subject).toEqual('Inquiry about services');
    expect(result.message).toEqual('I would like to know more about your medical services.');
    expect(result.is_read).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save contact message to database', async () => {
    const result = await createContactMessage(testContactInput);

    const messages = await db.select()
      .from(contactMessagesTable)
      .where(eq(contactMessagesTable.id, result.id))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].name).toEqual('John Doe');
    expect(messages[0].email).toEqual('john@example.com');
    expect(messages[0].phone).toEqual('+1234567890');
    expect(messages[0].subject).toEqual('Inquiry about services');
    expect(messages[0].message).toEqual('I would like to know more about your medical services.');
    expect(messages[0].is_read).toEqual(false);
    expect(messages[0].created_at).toBeInstanceOf(Date);
  });

  it('should set is_read to false by default', async () => {
    const result = await createContactMessage(testContactInput);

    expect(result.is_read).toEqual(false);
  });
});

describe('getContactMessages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no messages exist', async () => {
    const result = await getContactMessages();
    expect(result).toEqual([]);
  });

  it('should return all contact messages ordered by created_at DESC', async () => {
    // Create messages in sequence to ensure different timestamps
    const message1 = await createContactMessage(testContactInput);
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
    const message2 = await createContactMessage(testContactInput2);

    const result = await getContactMessages();

    expect(result).toHaveLength(2);
    // Should be ordered newest first
    expect(result[0].id).toEqual(message2.id);
    expect(result[0].name).toEqual('Jane Smith');
    expect(result[1].id).toEqual(message1.id);
    expect(result[1].name).toEqual('John Doe');
  });

  it('should handle pagination correctly', async () => {
    // Create multiple messages
    await createContactMessage(testContactInput);
    await createContactMessage(testContactInput2);
    await createContactMessage({
      ...testContactInput,
      name: 'Alice Johnson',
      email: 'alice@example.com'
    });

    const paginationInput: PaginationInput = { page: 1, limit: 2 };
    const result = await getContactMessages(paginationInput);

    expect(result).toHaveLength(2);
  });

  it('should handle second page pagination', async () => {
    // Create multiple messages
    await createContactMessage(testContactInput);
    await createContactMessage(testContactInput2);
    await createContactMessage({
      ...testContactInput,
      name: 'Alice Johnson',
      email: 'alice@example.com'
    });

    const paginationInput: PaginationInput = { page: 2, limit: 2 };
    const result = await getContactMessages(paginationInput);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('John Doe'); // Should be the oldest message
  });

  it('should use default pagination when no input provided', async () => {
    await createContactMessage(testContactInput);

    const result = await getContactMessages();

    expect(result).toHaveLength(1);
  });
});

describe('getContactMessageById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return contact message when found', async () => {
    const created = await createContactMessage(testContactInput);
    
    const getByIdInput: GetByIdInput = { id: created.id };
    const result = await getContactMessageById(getByIdInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(created.id);
    expect(result!.name).toEqual('John Doe');
    expect(result!.email).toEqual('john@example.com');
    expect(result!.phone).toEqual('+1234567890');
    expect(result!.subject).toEqual('Inquiry about services');
    expect(result!.message).toEqual('I would like to know more about your medical services.');
  });

  it('should return null when contact message not found', async () => {
    const getByIdInput: GetByIdInput = { id: 999 };
    const result = await getContactMessageById(getByIdInput);

    expect(result).toBeNull();
  });
});

describe('markContactMessageAsRead', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should mark contact message as read', async () => {
    const created = await createContactMessage(testContactInput);
    expect(created.is_read).toEqual(false);

    const updateInput: UpdateContactMessageInput = { 
      id: created.id, 
      is_read: true 
    };
    const result = await markContactMessageAsRead(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.is_read).toEqual(true);
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john@example.com');
  });

  it('should mark contact message as unread', async () => {
    const created = await createContactMessage(testContactInput);
    
    // First mark as read
    await markContactMessageAsRead({ id: created.id, is_read: true });
    
    // Then mark as unread
    const updateInput: UpdateContactMessageInput = { 
      id: created.id, 
      is_read: false 
    };
    const result = await markContactMessageAsRead(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.is_read).toEqual(false);
  });

  it('should update the database record', async () => {
    const created = await createContactMessage(testContactInput);

    const updateInput: UpdateContactMessageInput = { 
      id: created.id, 
      is_read: true 
    };
    await markContactMessageAsRead(updateInput);

    const messages = await db.select()
      .from(contactMessagesTable)
      .where(eq(contactMessagesTable.id, created.id))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].is_read).toEqual(true);
  });

  it('should throw error when contact message not found', async () => {
    const updateInput: UpdateContactMessageInput = { 
      id: 999, 
      is_read: true 
    };

    expect(markContactMessageAsRead(updateInput)).rejects.toThrow(/not found/i);
  });
});

describe('deleteContactMessage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete existing contact message', async () => {
    const created = await createContactMessage(testContactInput);

    const deleteInput: DeleteByIdInput = { id: created.id };
    const result = await deleteContactMessage(deleteInput);

    expect(result.success).toEqual(true);
  });

  it('should remove message from database', async () => {
    const created = await createContactMessage(testContactInput);

    const deleteInput: DeleteByIdInput = { id: created.id };
    await deleteContactMessage(deleteInput);

    const messages = await db.select()
      .from(contactMessagesTable)
      .where(eq(contactMessagesTable.id, created.id))
      .execute();

    expect(messages).toHaveLength(0);
  });

  it('should return success false when message does not exist', async () => {
    const deleteInput: DeleteByIdInput = { id: 999 };
    const result = await deleteContactMessage(deleteInput);

    expect(result.success).toEqual(false);
  });

  it('should not affect other messages when deleting', async () => {
    const message1 = await createContactMessage(testContactInput);
    const message2 = await createContactMessage(testContactInput2);

    const deleteInput: DeleteByIdInput = { id: message1.id };
    await deleteContactMessage(deleteInput);

    // Verify message2 still exists
    const remaining = await db.select()
      .from(contactMessagesTable)
      .where(eq(contactMessagesTable.id, message2.id))
      .execute();

    expect(remaining).toHaveLength(1);
    expect(remaining[0].name).toEqual('Jane Smith');
  });
});