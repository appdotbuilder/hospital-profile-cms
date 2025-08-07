import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { managementStaffTable } from '../db/schema';
import { type CreateManagementStaffInput, type UpdateManagementStaffInput } from '../schema';
import { 
  createManagementStaff,
  getManagementStaff,
  getManagementStaffById,
  updateManagementStaff,
  deleteManagementStaff
} from '../handlers/management_staff';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateManagementStaffInput = {
  name: 'Dr. John Smith',
  position: 'Chief Medical Officer',
  photo_url: 'https://example.com/photo.jpg',
  is_active: true
};

describe('Management Staff Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createManagementStaff', () => {
    it('should create management staff with all fields', async () => {
      const result = await createManagementStaff(testInput);

      expect(result.name).toEqual('Dr. John Smith');
      expect(result.position).toEqual('Chief Medical Officer');
      expect(result.photo_url).toEqual('https://example.com/photo.jpg');
      expect(result.is_active).toEqual(true);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create management staff with defaults applied', async () => {
      const minimalInput: CreateManagementStaffInput = {
        name: 'Jane Doe',
        position: 'Administrator',
        is_active: true
      };

      const result = await createManagementStaff(minimalInput);

      expect(result.name).toEqual('Jane Doe');
      expect(result.position).toEqual('Administrator');
      expect(result.photo_url).toBeNull();
      expect(result.is_active).toEqual(true); // Default from schema
      expect(result.id).toBeDefined();
    });

    it('should save management staff to database', async () => {
      const result = await createManagementStaff(testInput);

      const staffMembers = await db.select()
        .from(managementStaffTable)
        .where(eq(managementStaffTable.id, result.id))
        .execute();

      expect(staffMembers).toHaveLength(1);
      expect(staffMembers[0].name).toEqual('Dr. John Smith');
      expect(staffMembers[0].position).toEqual('Chief Medical Officer');
      expect(staffMembers[0].photo_url).toEqual('https://example.com/photo.jpg');
      expect(staffMembers[0].is_active).toEqual(true);
    });
  });

  describe('getManagementStaff', () => {
    it('should return empty array when no staff exists', async () => {
      const result = await getManagementStaff();
      expect(result).toHaveLength(0);
    });

    it('should return only active management staff', async () => {
      // Create active staff member
      await createManagementStaff(testInput);
      
      // Create inactive staff member
      const inactiveInput = { ...testInput, name: 'Inactive Staff', is_active: false };
      await createManagementStaff(inactiveInput);

      const result = await getManagementStaff();
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toEqual('Dr. John Smith');
      expect(result[0].is_active).toEqual(true);
    });

    it('should apply pagination correctly', async () => {
      // Create multiple staff members
      for (let i = 1; i <= 5; i++) {
        await createManagementStaff({
          ...testInput,
          name: `Staff Member ${i}`,
          position: `Position ${i}`
        });
      }

      // Test pagination
      const firstPage = await getManagementStaff({ page: 1, limit: 2 });
      const secondPage = await getManagementStaff({ page: 2, limit: 2 });

      expect(firstPage).toHaveLength(2);
      expect(secondPage).toHaveLength(2);
      
      // Should be different staff members
      expect(firstPage[0].id).not.toEqual(secondPage[0].id);
    });

    it('should order by created_at descending', async () => {
      // Create staff members with slight delay to ensure different timestamps
      const first = await createManagementStaff({ ...testInput, name: 'First Staff' });
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      const second = await createManagementStaff({ ...testInput, name: 'Second Staff' });

      const result = await getManagementStaff();

      expect(result).toHaveLength(2);
      // Most recent should be first
      expect(result[0].name).toEqual('Second Staff');
      expect(result[1].name).toEqual('First Staff');
    });
  });

  describe('getManagementStaffById', () => {
    it('should return null for non-existent staff member', async () => {
      const result = await getManagementStaffById({ id: 999 });
      expect(result).toBeNull();
    });

    it('should return management staff by ID', async () => {
      const created = await createManagementStaff(testInput);
      const result = await getManagementStaffById({ id: created.id });

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.name).toEqual('Dr. John Smith');
      expect(result!.position).toEqual('Chief Medical Officer');
    });

    it('should return inactive staff member by ID', async () => {
      const inactiveInput = { ...testInput, is_active: false };
      const created = await createManagementStaff(inactiveInput);
      const result = await getManagementStaffById({ id: created.id });

      expect(result).not.toBeNull();
      expect(result!.is_active).toEqual(false);
    });
  });

  describe('updateManagementStaff', () => {
    it('should throw error for non-existent staff member', async () => {
      const updateInput: UpdateManagementStaffInput = {
        id: 999,
        name: 'Updated Name'
      };

      await expect(updateManagementStaff(updateInput)).rejects.toThrow(/not found/i);
    });

    it('should update partial fields', async () => {
      const created = await createManagementStaff(testInput);
      
      const updateInput: UpdateManagementStaffInput = {
        id: created.id,
        name: 'Updated Name',
        position: 'Updated Position'
      };

      const result = await updateManagementStaff(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('Updated Name');
      expect(result.position).toEqual('Updated Position');
      expect(result.photo_url).toEqual(testInput.photo_url!); // Should remain unchanged
      expect(result.is_active).toEqual(testInput.is_active); // Should remain unchanged
      expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
    });

    it('should update photo_url to null', async () => {
      const created = await createManagementStaff(testInput);
      
      const updateInput: UpdateManagementStaffInput = {
        id: created.id,
        photo_url: null
      };

      const result = await updateManagementStaff(updateInput);
      expect(result.photo_url).toBeNull();
    });

    it('should update is_active status', async () => {
      const created = await createManagementStaff(testInput);
      
      const updateInput: UpdateManagementStaffInput = {
        id: created.id,
        is_active: false
      };

      const result = await updateManagementStaff(updateInput);
      expect(result.is_active).toEqual(false);
    });

    it('should persist changes to database', async () => {
      const created = await createManagementStaff(testInput);
      
      const updateInput: UpdateManagementStaffInput = {
        id: created.id,
        name: 'Database Updated Name'
      };

      await updateManagementStaff(updateInput);

      const fromDb = await db.select()
        .from(managementStaffTable)
        .where(eq(managementStaffTable.id, created.id))
        .execute();

      expect(fromDb).toHaveLength(1);
      expect(fromDb[0].name).toEqual('Database Updated Name');
    });
  });

  describe('deleteManagementStaff', () => {
    it('should return false for non-existent staff member', async () => {
      const result = await deleteManagementStaff({ id: 999 });
      expect(result.success).toEqual(false);
    });

    it('should delete management staff successfully', async () => {
      const created = await createManagementStaff(testInput);
      const result = await deleteManagementStaff({ id: created.id });

      expect(result.success).toEqual(true);

      // Verify deletion in database
      const fromDb = await db.select()
        .from(managementStaffTable)
        .where(eq(managementStaffTable.id, created.id))
        .execute();

      expect(fromDb).toHaveLength(0);
    });

    it('should remove staff from active listings after deletion', async () => {
      const created = await createManagementStaff(testInput);
      
      // Verify staff exists in listings
      let staff = await getManagementStaff();
      expect(staff).toHaveLength(1);

      // Delete staff
      await deleteManagementStaff({ id: created.id });

      // Verify staff no longer in listings
      staff = await getManagementStaff();
      expect(staff).toHaveLength(0);
    });
  });
});