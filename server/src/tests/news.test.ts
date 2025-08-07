import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { newsTable } from '../db/schema';
import { 
  type CreateNewsInput, 
  type UpdateNewsInput,
  type PaginationInput,
  type GetByIdInput,
  type DeleteByIdInput
} from '../schema';
import { 
  createNews, 
  getNews, 
  getLatestNews, 
  getNewsById, 
  getAllNewsForAdmin, 
  updateNews, 
  deleteNews 
} from '../handlers/news';
import { eq } from 'drizzle-orm';

// Test input data
const testNewsInput: CreateNewsInput = {
  title: 'Test News Article',
  content: 'This is a test news article content with detailed information about the hospital.',
  image_url: 'https://example.com/news-image.jpg',
  is_published: true
};

const unpublishedNewsInput: CreateNewsInput = {
  title: 'Unpublished News Article',
  content: 'This is an unpublished news article for testing admin functionality.',
  image_url: null,
  is_published: false
};

describe('News Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createNews', () => {
    it('should create a published news article', async () => {
      const result = await createNews(testNewsInput);

      expect(result.title).toEqual('Test News Article');
      expect(result.content).toEqual(testNewsInput.content);
      expect(result.image_url).toEqual('https://example.com/news-image.jpg');
      expect(result.is_published).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create an unpublished news article', async () => {
      const result = await createNews(unpublishedNewsInput);

      expect(result.title).toEqual('Unpublished News Article');
      expect(result.content).toEqual(unpublishedNewsInput.content);
      expect(result.image_url).toBeNull();
      expect(result.is_published).toBe(false);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save news article to database', async () => {
      const result = await createNews(testNewsInput);

      const savedNews = await db.select()
        .from(newsTable)
        .where(eq(newsTable.id, result.id))
        .execute();

      expect(savedNews).toHaveLength(1);
      expect(savedNews[0].title).toEqual('Test News Article');
      expect(savedNews[0].content).toEqual(testNewsInput.content);
      expect(savedNews[0].is_published).toBe(true);
      expect(savedNews[0].created_at).toBeInstanceOf(Date);
    });

    it('should handle null image_url correctly', async () => {
      const inputWithoutImage: CreateNewsInput = {
        title: 'News Without Image',
        content: 'Content without image',
        image_url: null,
        is_published: true
      };

      const result = await createNews(inputWithoutImage);
      expect(result.image_url).toBeNull();
    });
  });

  describe('getNews', () => {
    beforeEach(async () => {
      // Create test data
      await createNews(testNewsInput);
      await createNews(unpublishedNewsInput);
      await createNews({
        title: 'Another Published News',
        content: 'Another published content',
        image_url: null,
        is_published: true
      });
    });

    it('should return only published news articles', async () => {
      const result = await getNews();

      expect(result).toHaveLength(2); // Only published articles
      result.forEach(article => {
        expect(article.is_published).toBe(true);
      });
    });

    it('should order news by created_at DESC', async () => {
      const result = await getNews();

      expect(result).toHaveLength(2);
      // Most recent should be first
      expect(result[0].title).toEqual('Another Published News');
      expect(result[1].title).toEqual('Test News Article');
    });

    it('should handle pagination correctly', async () => {
      const paginationInput: PaginationInput = { page: 1, limit: 1 };
      const result = await getNews(paginationInput);

      expect(result).toHaveLength(1);
      expect(result[0].title).toEqual('Another Published News');
    });

    it('should return empty array when no published news exist', async () => {
      // Delete all published news
      await db.delete(newsTable).where(eq(newsTable.is_published, true)).execute();

      const result = await getNews();
      expect(result).toHaveLength(0);
    });
  });

  describe('getLatestNews', () => {
    beforeEach(async () => {
      // Create multiple published news articles
      for (let i = 1; i <= 7; i++) {
        await createNews({
          title: `News Article ${i}`,
          content: `Content for article ${i}`,
          image_url: null,
          is_published: true
        });
      }
      // Add one unpublished
      await createNews(unpublishedNewsInput);
    });

    it('should return maximum 5 latest published news articles', async () => {
      const result = await getLatestNews();

      expect(result).toHaveLength(5);
      result.forEach(article => {
        expect(article.is_published).toBe(true);
      });
    });

    it('should order by created_at DESC', async () => {
      const result = await getLatestNews();

      expect(result[0].title).toEqual('News Article 7');
      expect(result[1].title).toEqual('News Article 6');
      expect(result[4].title).toEqual('News Article 3');
    });

    it('should exclude unpublished articles', async () => {
      const result = await getLatestNews();

      const unpublishedFound = result.some(article => 
        article.title === 'Unpublished News Article'
      );
      expect(unpublishedFound).toBe(false);
    });
  });

  describe('getNewsById', () => {
    it('should return news article by ID', async () => {
      const created = await createNews(testNewsInput);
      const input: GetByIdInput = { id: created.id };

      const result = await getNewsById(input);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.title).toEqual('Test News Article');
      expect(result!.content).toEqual(testNewsInput.content);
    });

    it('should return unpublished news by ID', async () => {
      const created = await createNews(unpublishedNewsInput);
      const input: GetByIdInput = { id: created.id };

      const result = await getNewsById(input);

      expect(result).not.toBeNull();
      expect(result!.is_published).toBe(false);
      expect(result!.title).toEqual('Unpublished News Article');
    });

    it('should return null for non-existent ID', async () => {
      const input: GetByIdInput = { id: 99999 };

      const result = await getNewsById(input);

      expect(result).toBeNull();
    });
  });

  describe('getAllNewsForAdmin', () => {
    beforeEach(async () => {
      await createNews(testNewsInput);
      await createNews(unpublishedNewsInput);
      await createNews({
        title: 'Another Published News',
        content: 'Another published content',
        image_url: null,
        is_published: true
      });
    });

    it('should return all news articles (published and unpublished)', async () => {
      const result = await getAllNewsForAdmin();

      expect(result).toHaveLength(3);
      const publishedCount = result.filter(article => article.is_published).length;
      const unpublishedCount = result.filter(article => !article.is_published).length;
      expect(publishedCount).toEqual(2);
      expect(unpublishedCount).toEqual(1);
    });

    it('should order news by created_at DESC', async () => {
      const result = await getAllNewsForAdmin();

      expect(result[0].title).toEqual('Another Published News');
      expect(result[1].title).toEqual('Unpublished News Article');
      expect(result[2].title).toEqual('Test News Article');
    });

    it('should handle pagination correctly', async () => {
      const paginationInput: PaginationInput = { page: 1, limit: 2 };
      const result = await getAllNewsForAdmin(paginationInput);

      expect(result).toHaveLength(2);
    });
  });

  describe('updateNews', () => {
    it('should update news article successfully', async () => {
      const created = await createNews(testNewsInput);
      const updateInput: UpdateNewsInput = {
        id: created.id,
        title: 'Updated News Title',
        content: 'Updated news content',
        is_published: false
      };

      const result = await updateNews(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.title).toEqual('Updated News Title');
      expect(result.content).toEqual('Updated news content');
      expect(result.is_published).toBe(false);
      expect(result.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
    });

    it('should update only provided fields', async () => {
      const created = await createNews(testNewsInput);
      const updateInput: UpdateNewsInput = {
        id: created.id,
        title: 'Only Title Updated'
      };

      const result = await updateNews(updateInput);

      expect(result.title).toEqual('Only Title Updated');
      expect(result.content).toEqual(testNewsInput.content); // Unchanged
      expect(result.is_published).toEqual(testNewsInput.is_published); // Unchanged
    });

    it('should update news in database', async () => {
      const created = await createNews(testNewsInput);
      const updateInput: UpdateNewsInput = {
        id: created.id,
        title: 'Database Update Test'
      };

      await updateNews(updateInput);

      const updatedNews = await db.select()
        .from(newsTable)
        .where(eq(newsTable.id, created.id))
        .execute();

      expect(updatedNews[0].title).toEqual('Database Update Test');
    });

    it('should throw error for non-existent news ID', async () => {
      const updateInput: UpdateNewsInput = {
        id: 99999,
        title: 'This should fail'
      };

      await expect(updateNews(updateInput)).rejects.toThrow(/not found/i);
    });
  });

  describe('deleteNews', () => {
    it('should delete news article successfully', async () => {
      const created = await createNews(testNewsInput);
      const deleteInput: DeleteByIdInput = { id: created.id };

      const result = await deleteNews(deleteInput);

      expect(result.success).toBe(true);
    });

    it('should remove news from database', async () => {
      const created = await createNews(testNewsInput);
      const deleteInput: DeleteByIdInput = { id: created.id };

      await deleteNews(deleteInput);

      const deletedNews = await db.select()
        .from(newsTable)
        .where(eq(newsTable.id, created.id))
        .execute();

      expect(deletedNews).toHaveLength(0);
    });

    it('should throw error for non-existent news ID', async () => {
      const deleteInput: DeleteByIdInput = { id: 99999 };

      await expect(deleteNews(deleteInput)).rejects.toThrow(/not found/i);
    });
  });
});