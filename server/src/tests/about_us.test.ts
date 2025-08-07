import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { aboutUsTable } from '../db/schema';
import { type UpdateAboutUsInput } from '../schema';
import { getAboutUs, updateAboutUs } from '../handlers/about_us';
import { eq } from 'drizzle-orm';

const testInput: UpdateAboutUsInput = {
  content: 'Our hospital has been serving the community since 1950. We provide comprehensive healthcare services with a focus on patient care and medical excellence.'
};

describe('About Us Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('getAboutUs', () => {
    it('should return null when no about us content exists', async () => {
      const result = await getAboutUs();
      expect(result).toBeNull();
    });

    it('should return existing about us content', async () => {
      // Insert test data directly
      await db.insert(aboutUsTable)
        .values({
          content: 'Test hospital content'
        })
        .execute();

      const result = await getAboutUs();

      expect(result).not.toBeNull();
      expect(result!.content).toEqual('Test hospital content');
      expect(result!.id).toBeDefined();
      expect(result!.created_at).toBeInstanceOf(Date);
      expect(result!.updated_at).toBeInstanceOf(Date);
    });

    it('should return only the first record when multiple exist', async () => {
      // Insert multiple records (edge case)
      await db.insert(aboutUsTable)
        .values([
          { content: 'First content' },
          { content: 'Second content' }
        ])
        .execute();

      const result = await getAboutUs();

      expect(result).not.toBeNull();
      expect(result!.content).toEqual('First content');
    });
  });

  describe('updateAboutUs', () => {
    it('should create new about us content when none exists', async () => {
      const result = await updateAboutUs(testInput);

      expect(result.content).toEqual(testInput.content);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);

      // Verify it was saved to database
      const savedRecord = await db.select()
        .from(aboutUsTable)
        .where(eq(aboutUsTable.id, result.id))
        .execute();

      expect(savedRecord).toHaveLength(1);
      expect(savedRecord[0].content).toEqual(testInput.content);
    });

    it('should update existing about us content', async () => {
      // Create initial record
      const initialResult = await updateAboutUs({
        content: 'Initial content'
      });

      // Wait a small amount to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update the record
      const updatedResult = await updateAboutUs({
        content: 'Updated content'
      });

      expect(updatedResult.id).toEqual(initialResult.id);
      expect(updatedResult.content).toEqual('Updated content');
      expect(updatedResult.updated_at.getTime()).toBeGreaterThan(initialResult.updated_at.getTime());

      // Verify only one record exists in database
      const allRecords = await db.select()
        .from(aboutUsTable)
        .execute();

      expect(allRecords).toHaveLength(1);
      expect(allRecords[0].content).toEqual('Updated content');
    });

    it('should handle long content correctly', async () => {
      const longContent = 'A'.repeat(5000); // Very long content
      const result = await updateAboutUs({
        content: longContent
      });

      expect(result.content).toEqual(longContent);
      expect(result.content.length).toEqual(5000);
    });

    it('should handle special characters in content', async () => {
      const specialContent = 'Hospital & Medical Center™ - "Excellence" in Care (2024) <script>alert("test")</script>';
      const result = await updateAboutUs({
        content: specialContent
      });

      expect(result.content).toEqual(specialContent);

      // Verify it was saved correctly
      const savedRecord = await db.select()
        .from(aboutUsTable)
        .where(eq(aboutUsTable.id, result.id))
        .execute();

      expect(savedRecord[0].content).toEqual(specialContent);
    });
  });

  describe('Integration tests', () => {
    it('should work correctly with getAboutUs after updateAboutUs', async () => {
      // Initially no content
      let result = await getAboutUs();
      expect(result).toBeNull();

      // Create content
      await updateAboutUs(testInput);

      // Should now return the content
      result = await getAboutUs();
      expect(result).not.toBeNull();
      expect(result!.content).toEqual(testInput.content);

      // Update content
      await updateAboutUs({
        content: 'Updated hospital information'
      });

      // Should return updated content
      result = await getAboutUs();
      expect(result).not.toBeNull();
      expect(result!.content).toEqual('Updated hospital information');
    });
  });
});