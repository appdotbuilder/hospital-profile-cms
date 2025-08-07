import { db } from '../db';
import { aboutUsTable } from '../db/schema';
import { type UpdateAboutUsInput, type AboutUs } from '../schema';
import { eq } from 'drizzle-orm';

export async function getAboutUs(): Promise<AboutUs | null> {
  try {
    // Get the first (and should be only) about us record
    const results = await db.select()
      .from(aboutUsTable)
      .limit(1)
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Failed to fetch about us content:', error);
    throw error;
  }
}

export async function updateAboutUs(input: UpdateAboutUsInput): Promise<AboutUs> {
  try {
    // First, check if a record exists
    const existingRecord = await getAboutUs();

    if (existingRecord) {
      // Update the existing record
      const result = await db.update(aboutUsTable)
        .set({
          content: input.content,
          updated_at: new Date()
        })
        .where(eq(aboutUsTable.id, existingRecord.id))
        .returning()
        .execute();

      return result[0];
    } else {
      // Create a new record
      const result = await db.insert(aboutUsTable)
        .values({
          content: input.content
        })
        .returning()
        .execute();

      return result[0];
    }
  } catch (error) {
    console.error('Failed to update about us content:', error);
    throw error;
  }
}