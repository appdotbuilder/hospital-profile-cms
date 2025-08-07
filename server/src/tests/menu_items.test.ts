import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menuItemsTable } from '../db/schema';
import { 
  type CreateMenuItemInput, 
  type UpdateMenuItemInput,
  type GetByIdInput,
  type DeleteByIdInput 
} from '../schema';
import { 
  createMenuItem, 
  getMenuItems, 
  getMenuItemById, 
  updateMenuItem, 
  deleteMenuItem 
} from '../handlers/menu_items';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateMenuItemInput = {
  title: 'Test Menu Item',
  url: '/test',
  order_index: 1,
  is_active: true
};

const testInput2: CreateMenuItemInput = {
  title: 'Second Menu Item',
  url: '/second',
  order_index: 2,
  is_active: true
};

const inactiveTestInput: CreateMenuItemInput = {
  title: 'Inactive Menu Item',
  url: '/inactive',
  order_index: 3,
  is_active: false
};

describe('createMenuItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a menu item', async () => {
    const result = await createMenuItem(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Menu Item');
    expect(result.url).toEqual('/test');
    expect(result.order_index).toEqual(1);
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save menu item to database', async () => {
    const result = await createMenuItem(testInput);

    // Query database to verify persistence
    const menuItems = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, result.id))
      .execute();

    expect(menuItems).toHaveLength(1);
    expect(menuItems[0].title).toEqual('Test Menu Item');
    expect(menuItems[0].url).toEqual('/test');
    expect(menuItems[0].order_index).toEqual(1);
    expect(menuItems[0].is_active).toEqual(true);
    expect(menuItems[0].created_at).toBeInstanceOf(Date);
    expect(menuItems[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create menu item with default is_active value', async () => {
    const inputWithDefaults = {
      title: 'Default Menu Item',
      url: '/default',
      order_index: 1,
      is_active: true // This is the default from Zod schema
    };

    const result = await createMenuItem(inputWithDefaults);
    expect(result.is_active).toEqual(true);
  });
});

describe('getMenuItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no menu items exist', async () => {
    const result = await getMenuItems();
    expect(result).toEqual([]);
  });

  it('should return all active menu items ordered by order_index', async () => {
    // Create multiple menu items with different order indices
    await createMenuItem(testInput2); // order_index: 2
    await createMenuItem(testInput); // order_index: 1
    await createMenuItem(inactiveTestInput); // order_index: 3, inactive

    const result = await getMenuItems();

    // Should return only active items, ordered by order_index
    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Test Menu Item'); // order_index: 1
    expect(result[0].order_index).toEqual(1);
    expect(result[1].title).toEqual('Second Menu Item'); // order_index: 2
    expect(result[1].order_index).toEqual(2);

    // Verify inactive item is not included
    const inactiveItemExists = result.some(item => item.title === 'Inactive Menu Item');
    expect(inactiveItemExists).toBe(false);
  });

  it('should return menu items with all expected fields', async () => {
    await createMenuItem(testInput);
    
    const result = await getMenuItems();
    
    expect(result).toHaveLength(1);
    const menuItem = result[0];
    expect(menuItem.id).toBeDefined();
    expect(menuItem.title).toBeDefined();
    expect(menuItem.url).toBeDefined();
    expect(menuItem.order_index).toBeDefined();
    expect(menuItem.is_active).toBeDefined();
    expect(menuItem.created_at).toBeInstanceOf(Date);
    expect(menuItem.updated_at).toBeInstanceOf(Date);
  });
});

describe('getMenuItemById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return menu item by ID', async () => {
    const created = await createMenuItem(testInput);
    const input: GetByIdInput = { id: created.id };
    
    const result = await getMenuItemById(input);
    
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(created.id);
    expect(result!.title).toEqual('Test Menu Item');
    expect(result!.url).toEqual('/test');
    expect(result!.order_index).toEqual(1);
    expect(result!.is_active).toEqual(true);
  });

  it('should return null for non-existent ID', async () => {
    const input: GetByIdInput = { id: 999 };
    
    const result = await getMenuItemById(input);
    
    expect(result).toBeNull();
  });

  it('should return inactive menu items when queried by ID', async () => {
    const created = await createMenuItem(inactiveTestInput);
    const input: GetByIdInput = { id: created.id };
    
    const result = await getMenuItemById(input);
    
    expect(result).not.toBeNull();
    expect(result!.is_active).toEqual(false);
  });
});

describe('updateMenuItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update menu item title', async () => {
    const created = await createMenuItem(testInput);
    const updateInput: UpdateMenuItemInput = {
      id: created.id,
      title: 'Updated Title'
    };
    
    const result = await updateMenuItem(updateInput);
    
    expect(result.title).toEqual('Updated Title');
    expect(result.url).toEqual(created.url); // Unchanged
    expect(result.order_index).toEqual(created.order_index); // Unchanged
    expect(result.is_active).toEqual(created.is_active); // Unchanged
  });

  it('should update multiple fields', async () => {
    const created = await createMenuItem(testInput);
    const updateInput: UpdateMenuItemInput = {
      id: created.id,
      title: 'Updated Title',
      url: '/updated-url',
      order_index: 5,
      is_active: false
    };
    
    const result = await updateMenuItem(updateInput);
    
    expect(result.title).toEqual('Updated Title');
    expect(result.url).toEqual('/updated-url');
    expect(result.order_index).toEqual(5);
    expect(result.is_active).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
  });

  it('should update only provided fields', async () => {
    const created = await createMenuItem(testInput);
    const updateInput: UpdateMenuItemInput = {
      id: created.id,
      url: '/new-url'
    };
    
    const result = await updateMenuItem(updateInput);
    
    expect(result.title).toEqual(created.title); // Unchanged
    expect(result.url).toEqual('/new-url'); // Changed
    expect(result.order_index).toEqual(created.order_index); // Unchanged
    expect(result.is_active).toEqual(created.is_active); // Unchanged
  });

  it('should persist updates to database', async () => {
    const created = await createMenuItem(testInput);
    const updateInput: UpdateMenuItemInput = {
      id: created.id,
      title: 'Database Update Test'
    };
    
    await updateMenuItem(updateInput);
    
    // Verify changes in database
    const menuItems = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, created.id))
      .execute();
    
    expect(menuItems).toHaveLength(1);
    expect(menuItems[0].title).toEqual('Database Update Test');
  });

  it('should throw error for non-existent menu item', async () => {
    const updateInput: UpdateMenuItemInput = {
      id: 999,
      title: 'Non-existent Item'
    };
    
    await expect(updateMenuItem(updateInput)).rejects.toThrow(/not found/i);
  });
});

describe('deleteMenuItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete existing menu item', async () => {
    const created = await createMenuItem(testInput);
    const deleteInput: DeleteByIdInput = { id: created.id };
    
    const result = await deleteMenuItem(deleteInput);
    
    expect(result.success).toBe(true);
    
    // Verify deletion in database
    const menuItems = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, created.id))
      .execute();
    
    expect(menuItems).toHaveLength(0);
  });

  it('should return false for non-existent menu item', async () => {
    const deleteInput: DeleteByIdInput = { id: 999 };
    
    const result = await deleteMenuItem(deleteInput);
    
    expect(result.success).toBe(false);
  });

  it('should not affect other menu items', async () => {
    const created1 = await createMenuItem(testInput);
    const created2 = await createMenuItem(testInput2);
    const deleteInput: DeleteByIdInput = { id: created1.id };
    
    await deleteMenuItem(deleteInput);
    
    // Verify only one item was deleted
    const remainingItems = await db.select()
      .from(menuItemsTable)
      .execute();
    
    expect(remainingItems).toHaveLength(1);
    expect(remainingItems[0].id).toEqual(created2.id);
  });
});