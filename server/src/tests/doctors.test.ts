import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { doctorsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
} from '../handlers/doctors';
import { 
  type CreateDoctorInput,
  type UpdateDoctorInput,
  type PaginationInput 
} from '../schema';

// Test data
const testDoctorInput: CreateDoctorInput = {
  name: 'Dr. John Smith',
  specialization: 'Cardiology',
  photo_url: 'https://example.com/photo.jpg',
  is_active: true
};

const testDoctorInputMinimal: CreateDoctorInput = {
  name: 'Dr. Jane Doe',
  specialization: 'Neurology',
  is_active: true // Default will be applied by Zod
};

describe('Doctor Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createDoctor', () => {
    it('should create a doctor with all fields', async () => {
      const result = await createDoctor(testDoctorInput);

      expect(result.name).toEqual('Dr. John Smith');
      expect(result.specialization).toEqual('Cardiology');
      expect(result.photo_url).toEqual('https://example.com/photo.jpg');
      expect(result.is_active).toEqual(true);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a doctor with minimal fields and null photo_url', async () => {
      const result = await createDoctor(testDoctorInputMinimal);

      expect(result.name).toEqual('Dr. Jane Doe');
      expect(result.specialization).toEqual('Neurology');
      expect(result.photo_url).toBeNull();
      expect(result.is_active).toEqual(true);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save doctor to database', async () => {
      const result = await createDoctor(testDoctorInput);

      const doctors = await db.select()
        .from(doctorsTable)
        .where(eq(doctorsTable.id, result.id))
        .execute();

      expect(doctors).toHaveLength(1);
      expect(doctors[0].name).toEqual('Dr. John Smith');
      expect(doctors[0].specialization).toEqual('Cardiology');
      expect(doctors[0].photo_url).toEqual('https://example.com/photo.jpg');
      expect(doctors[0].is_active).toEqual(true);
    });

    it('should handle undefined photo_url as null', async () => {
      const inputWithoutPhoto: CreateDoctorInput = {
        name: 'Dr. No Photo',
        specialization: 'General Practice',
        is_active: true
      };

      const result = await createDoctor(inputWithoutPhoto);
      expect(result.photo_url).toBeNull();
    });
  });

  describe('getDoctors', () => {
    beforeEach(async () => {
      // Create test doctors - some active, some inactive
      await createDoctor({
        name: 'Dr. Active One',
        specialization: 'Cardiology',
        is_active: true
      });
      
      await createDoctor({
        name: 'Dr. Active Two',
        specialization: 'Neurology',
        is_active: true
      });

      // Create inactive doctor
      await db.insert(doctorsTable)
        .values({
          name: 'Dr. Inactive',
          specialization: 'Dermatology',
          is_active: false
        })
        .execute();
    });

    it('should return all active doctors without pagination', async () => {
      const results = await getDoctors();

      expect(results).toHaveLength(2);
      expect(results.every(doctor => doctor.is_active)).toBe(true);
      expect(results.some(doctor => doctor.name === 'Dr. Active One')).toBe(true);
      expect(results.some(doctor => doctor.name === 'Dr. Active Two')).toBe(true);
      expect(results.some(doctor => doctor.name === 'Dr. Inactive')).toBe(false);
    });

    it('should return paginated active doctors', async () => {
      const pagination: PaginationInput = {
        page: 1,
        limit: 1
      };

      const results = await getDoctors(pagination);

      expect(results).toHaveLength(1);
      expect(results[0].is_active).toBe(true);
    });

    it('should return empty array for page beyond available data', async () => {
      const pagination: PaginationInput = {
        page: 10,
        limit: 10
      };

      const results = await getDoctors(pagination);
      expect(results).toHaveLength(0);
    });

    it('should handle page 2 correctly', async () => {
      const pagination: PaginationInput = {
        page: 2,
        limit: 1
      };

      const results = await getDoctors(pagination);
      expect(results).toHaveLength(1);
      expect(results[0].is_active).toBe(true);
    });
  });

  describe('getDoctorById', () => {
    it('should return doctor by valid ID', async () => {
      const created = await createDoctor(testDoctorInput);
      const result = await getDoctorById({ id: created.id });

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.name).toEqual('Dr. John Smith');
      expect(result!.specialization).toEqual('Cardiology');
      expect(result!.photo_url).toEqual('https://example.com/photo.jpg');
    });

    it('should return null for non-existent ID', async () => {
      const result = await getDoctorById({ id: 999 });
      expect(result).toBeNull();
    });

    it('should return inactive doctor by ID', async () => {
      // Create inactive doctor directly in database
      const insertResult = await db.insert(doctorsTable)
        .values({
          name: 'Dr. Inactive',
          specialization: 'Dermatology',
          is_active: false
        })
        .returning()
        .execute();

      const result = await getDoctorById({ id: insertResult[0].id });
      
      expect(result).not.toBeNull();
      expect(result!.is_active).toBe(false);
      expect(result!.name).toEqual('Dr. Inactive');
    });
  });

  describe('updateDoctor', () => {
    it('should update all doctor fields', async () => {
      const created = await createDoctor(testDoctorInput);

      const updateInput: UpdateDoctorInput = {
        id: created.id,
        name: 'Dr. Updated Name',
        specialization: 'Updated Specialty',
        photo_url: 'https://example.com/new-photo.jpg',
        is_active: false
      };

      const result = await updateDoctor(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('Dr. Updated Name');
      expect(result.specialization).toEqual('Updated Specialty');
      expect(result.photo_url).toEqual('https://example.com/new-photo.jpg');
      expect(result.is_active).toBe(false);
      expect(result.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
    });

    it('should update only provided fields', async () => {
      const created = await createDoctor(testDoctorInput);

      const updateInput: UpdateDoctorInput = {
        id: created.id,
        name: 'Dr. New Name Only'
      };

      const result = await updateDoctor(updateInput);

      expect(result.name).toEqual('Dr. New Name Only');
      expect(result.specialization).toEqual(created.specialization); // Unchanged
      expect(result.photo_url).toEqual(created.photo_url); // Unchanged
      expect(result.is_active).toEqual(created.is_active); // Unchanged
    });

    it('should update photo_url to null', async () => {
      const created = await createDoctor(testDoctorInput);

      const updateInput: UpdateDoctorInput = {
        id: created.id,
        photo_url: null
      };

      const result = await updateDoctor(updateInput);
      expect(result.photo_url).toBeNull();
    });

    it('should throw error for non-existent doctor', async () => {
      const updateInput: UpdateDoctorInput = {
        id: 999,
        name: 'Non-existent Doctor'
      };

      expect(updateDoctor(updateInput)).rejects.toThrow(/not found/i);
    });

    it('should persist changes to database', async () => {
      const created = await createDoctor(testDoctorInput);

      await updateDoctor({
        id: created.id,
        name: 'Dr. Database Update'
      });

      const fromDb = await getDoctorById({ id: created.id });
      expect(fromDb!.name).toEqual('Dr. Database Update');
    });
  });

  describe('deleteDoctor', () => {
    it('should delete existing doctor', async () => {
      const created = await createDoctor(testDoctorInput);

      const result = await deleteDoctor({ id: created.id });
      expect(result.success).toBe(true);

      // Verify deletion
      const deleted = await getDoctorById({ id: created.id });
      expect(deleted).toBeNull();
    });

    it('should throw error for non-existent doctor', async () => {
      expect(deleteDoctor({ id: 999 })).rejects.toThrow(/not found/i);
    });

    it('should remove doctor from database completely', async () => {
      const created = await createDoctor(testDoctorInput);

      await deleteDoctor({ id: created.id });

      // Check database directly
      const doctors = await db.select()
        .from(doctorsTable)
        .where(eq(doctorsTable.id, created.id))
        .execute();

      expect(doctors).toHaveLength(0);
    });
  });

  describe('Integration tests', () => {
    it('should handle complete CRUD workflow', async () => {
      // Create
      const created = await createDoctor(testDoctorInput);
      expect(created.id).toBeDefined();

      // Read
      const fetched = await getDoctorById({ id: created.id });
      expect(fetched!.name).toEqual(testDoctorInput.name);

      // Update
      const updated = await updateDoctor({
        id: created.id,
        name: 'Dr. Updated'
      });
      expect(updated.name).toEqual('Dr. Updated');

      // Delete
      const deleteResult = await deleteDoctor({ id: created.id });
      expect(deleteResult.success).toBe(true);

      // Verify deletion
      const deletedDoctor = await getDoctorById({ id: created.id });
      expect(deletedDoctor).toBeNull();
    });

    it('should handle multiple doctors with pagination', async () => {
      // Create multiple doctors
      const doctors = [];
      for (let i = 1; i <= 5; i++) {
        doctors.push(await createDoctor({
          name: `Dr. Test ${i}`,
          specialization: `Specialty ${i}`,
          is_active: true
        }));
      }

      // Test pagination
      const page1 = await getDoctors({ page: 1, limit: 2 });
      expect(page1).toHaveLength(2);

      const page2 = await getDoctors({ page: 2, limit: 2 });
      expect(page2).toHaveLength(2);

      const page3 = await getDoctors({ page: 3, limit: 2 });
      expect(page3).toHaveLength(1);

      // Ensure no duplicates across pages
      const allIds = [...page1, ...page2, ...page3].map(d => d.id);
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toEqual(allIds.length);
    });
  });
});