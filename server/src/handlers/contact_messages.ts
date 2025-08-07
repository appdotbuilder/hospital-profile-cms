import { db } from '../db';
import { contactMessagesTable } from '../db/schema';
import { 
  type CreateContactMessageInput, 
  type UpdateContactMessageInput, 
  type ContactMessage, 
  type DeleteByIdInput,
  type GetByIdInput,
  type PaginationInput 
} from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function createContactMessage(input: CreateContactMessageInput): Promise<ContactMessage> {
  try {
    const result = await db.insert(contactMessagesTable)
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        subject: input.subject,
        message: input.message,
        is_read: false // Default value for new messages
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Contact message creation failed:', error);
    throw error;
  }
}

export async function getContactMessages(input?: PaginationInput): Promise<ContactMessage[]> {
  try {
    // Apply defaults if input not provided
    const page = input?.page || 1;
    const limit = input?.limit || 10;
    const offset = (page - 1) * limit;

    const results = await db.select()
      .from(contactMessagesTable)
      .orderBy(desc(contactMessagesTable.created_at))
      .limit(limit)
      .offset(offset)
      .execute();

    return results;
  } catch (error) {
    console.error('Contact messages fetch failed:', error);
    throw error;
  }
}

export async function getContactMessageById(input: GetByIdInput): Promise<ContactMessage | null> {
  try {
    const results = await db.select()
      .from(contactMessagesTable)
      .where(eq(contactMessagesTable.id, input.id))
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Contact message fetch by ID failed:', error);
    throw error;
  }
}

export async function markContactMessageAsRead(input: UpdateContactMessageInput): Promise<ContactMessage> {
  try {
    const result = await db.update(contactMessagesTable)
      .set({
        is_read: input.is_read
      })
      .where(eq(contactMessagesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Contact message with ID ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Contact message update failed:', error);
    throw error;
  }
}

export async function deleteContactMessage(input: DeleteByIdInput): Promise<{ success: boolean }> {
  try {
    const result = await db.delete(contactMessagesTable)
      .where(eq(contactMessagesTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Contact message deletion failed:', error);
    throw error;
  }
}