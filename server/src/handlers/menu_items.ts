import { db } from '../db';
import { menuItemsTable } from '../db/schema';
import { 
  type CreateMenuItemInput, 
  type UpdateMenuItemInput, 
  type MenuItem, 
  type DeleteByIdInput,
  type GetByIdInput 
} from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function createMenuItem(input: CreateMenuItemInput): Promise<MenuItem> {
  try {
    // Insert menu item record
    const result = await db.insert(menuItemsTable)
      .values({
        title: input.title,
        url: input.url,
        order_index: input.order_index,
        is_active: input.is_active
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Menu item creation failed:', error);
    throw error;
  }
}

export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    // Fetch all active menu items ordered by order_index
    const results = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.is_active, true))
      .orderBy(asc(menuItemsTable.order_index))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    throw error;
  }
}

export async function getMenuItemById(input: GetByIdInput): Promise<MenuItem | null> {
  try {
    // Fetch specific menu item by ID
    const results = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, input.id))
      .execute();

    return results[0] || null;
  } catch (error) {
    console.error('Failed to fetch menu item by ID:', error);
    throw error;
  }
}

export async function updateMenuItem(input: UpdateMenuItemInput): Promise<MenuItem> {
  try {
    // Build update values object with only provided fields
    const updateValues: Partial<typeof menuItemsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.title !== undefined) updateValues.title = input.title;
    if (input.url !== undefined) updateValues.url = input.url;
    if (input.order_index !== undefined) updateValues.order_index = input.order_index;
    if (input.is_active !== undefined) updateValues.is_active = input.is_active;

    // Update menu item record
    const result = await db.update(menuItemsTable)
      .set(updateValues)
      .where(eq(menuItemsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Menu item with ID ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Menu item update failed:', error);
    throw error;
  }
}

export async function deleteMenuItem(input: DeleteByIdInput): Promise<{ success: boolean }> {
  try {
    // Delete menu item record
    const result = await db.delete(menuItemsTable)
      .where(eq(menuItemsTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Menu item deletion failed:', error);
    throw error;
  }
}