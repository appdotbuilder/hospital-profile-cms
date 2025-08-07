import { db } from '../db';
import { doctorsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { 
  type CreateDoctorInput, 
  type UpdateDoctorInput, 
  type Doctor, 
  type DeleteByIdInput,
  type GetByIdInput,
  type PaginationInput 
} from '../schema';

export async function createDoctor(input: CreateDoctorInput): Promise<Doctor> {
  try {
    const result = await db.insert(doctorsTable)
      .values({
        name: input.name,
        specialization: input.specialization,
        photo_url: input.photo_url || null,
        is_active: input.is_active
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Doctor creation failed:', error);
    throw error;
  }
}

export async function getDoctors(input?: PaginationInput): Promise<Doctor[]> {
  try {
    // Build query step by step to maintain proper type inference
    const baseQuery = db.select()
      .from(doctorsTable)
      .where(eq(doctorsTable.is_active, true));

    if (input) {
      const offset = (input.page - 1) * input.limit;
      const results = await baseQuery
        .limit(input.limit)
        .offset(offset)
        .execute();
      return results;
    } else {
      const results = await baseQuery.execute();
      return results;
    }
  } catch (error) {
    console.error('Failed to fetch doctors:', error);
    throw error;
  }
}

export async function getDoctorById(input: GetByIdInput): Promise<Doctor | null> {
  try {
    const results = await db.select()
      .from(doctorsTable)
      .where(eq(doctorsTable.id, input.id))
      .execute();

    return results[0] || null;
  } catch (error) {
    console.error('Failed to fetch doctor by ID:', error);
    throw error;
  }
}

export async function updateDoctor(input: UpdateDoctorInput): Promise<Doctor> {
  try {
    // First check if the doctor exists
    const existingDoctor = await getDoctorById({ id: input.id });
    if (!existingDoctor) {
      throw new Error(`Doctor with ID ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.specialization !== undefined) updateData.specialization = input.specialization;
    if (input.photo_url !== undefined) updateData.photo_url = input.photo_url;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    const result = await db.update(doctorsTable)
      .set(updateData)
      .where(eq(doctorsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Doctor update failed:', error);
    throw error;
  }
}

export async function deleteDoctor(input: DeleteByIdInput): Promise<{ success: boolean }> {
  try {
    // First check if the doctor exists
    const existingDoctor = await getDoctorById({ id: input.id });
    if (!existingDoctor) {
      throw new Error(`Doctor with ID ${input.id} not found`);
    }

    await db.delete(doctorsTable)
      .where(eq(doctorsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Doctor deletion failed:', error);
    throw error;
  }
}