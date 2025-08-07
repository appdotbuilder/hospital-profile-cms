import { db } from '../db';
import { newsTable } from '../db/schema';
import { 
  type CreateNewsInput, 
  type UpdateNewsInput, 
  type News, 
  type DeleteByIdInput,
  type GetByIdInput,
  type PaginationInput 
} from '../schema';
import { eq, desc, and, SQL } from 'drizzle-orm';

export async function createNews(input: CreateNewsInput): Promise<News> {
  try {
    const result = await db.insert(newsTable)
      .values({
        title: input.title,
        content: input.content,
        image_url: input.image_url || null,
        is_published: input.is_published,
        updated_at: new Date()
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('News creation failed:', error);
    throw error;
  }
}

export async function getNews(input?: PaginationInput): Promise<News[]> {
  try {
    const page = input?.page ?? 1;
    const limit = input?.limit ?? 10;
    const offset = (page - 1) * limit;

    const results = await db.select()
      .from(newsTable)
      .where(eq(newsTable.is_published, true))
      .orderBy(desc(newsTable.created_at))
      .limit(limit)
      .offset(offset)
      .execute();

    return results;
  } catch (error) {
    console.error('News retrieval failed:', error);
    throw error;
  }
}

export async function getLatestNews(): Promise<News[]> {
  try {
    const results = await db.select()
      .from(newsTable)
      .where(eq(newsTable.is_published, true))
      .orderBy(desc(newsTable.created_at))
      .limit(5)
      .execute();

    return results;
  } catch (error) {
    console.error('Latest news retrieval failed:', error);
    throw error;
  }
}

export async function getNewsById(input: GetByIdInput): Promise<News | null> {
  try {
    const results = await db.select()
      .from(newsTable)
      .where(eq(newsTable.id, input.id))
      .execute();

    return results[0] || null;
  } catch (error) {
    console.error('News by ID retrieval failed:', error);
    throw error;
  }
}

export async function getAllNewsForAdmin(input?: PaginationInput): Promise<News[]> {
  try {
    const page = input?.page ?? 1;
    const limit = input?.limit ?? 10;
    const offset = (page - 1) * limit;

    const results = await db.select()
      .from(newsTable)
      .orderBy(desc(newsTable.created_at))
      .limit(limit)
      .offset(offset)
      .execute();

    return results;
  } catch (error) {
    console.error('Admin news retrieval failed:', error);
    throw error;
  }
}

export async function updateNews(input: UpdateNewsInput): Promise<News> {
  try {
    const updateData: Record<string, any> = {
      updated_at: new Date()
    };

    // Only update fields that are provided
    if (input.title !== undefined) {
      updateData['title'] = input.title;
    }
    if (input.content !== undefined) {
      updateData['content'] = input.content;
    }
    if (input.image_url !== undefined) {
      updateData['image_url'] = input.image_url;
    }
    if (input.is_published !== undefined) {
      updateData['is_published'] = input.is_published;
    }

    const result = await db.update(newsTable)
      .set(updateData)
      .where(eq(newsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`News article with ID ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('News update failed:', error);
    throw error;
  }
}

export async function deleteNews(input: DeleteByIdInput): Promise<{ success: boolean }> {
  try {
    const result = await db.delete(newsTable)
      .where(eq(newsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`News article with ID ${input.id} not found`);
    }

    return { success: true };
  } catch (error) {
    console.error('News deletion failed:', error);
    throw error;
  }
}