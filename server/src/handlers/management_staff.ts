import { db } from '../db';
import { managementStaffTable } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { 
  type CreateManagementStaffInput, 
  type UpdateManagementStaffInput, 
  type ManagementStaff, 
  type DeleteByIdInput,
  type GetByIdInput,
  type PaginationInput 
} from '../schema';

export async function createManagementStaff(input: CreateManagementStaffInput): Promise<ManagementStaff> {
  try {
    const result = await db.insert(managementStaffTable)
      .values({
        name: input.name,
        position: input.position,
        photo_url: input.photo_url || null,
        is_active: input.is_active
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Management staff creation failed:', error);
    throw error;
  }
}

export async function getManagementStaff(input?: PaginationInput): Promise<ManagementStaff[]> {
  try {
    const page = input?.page || 1;
    const limit = input?.limit || 10;
    const offset = (page - 1) * limit;

    const results = await db.select()
      .from(managementStaffTable)
      .where(eq(managementStaffTable.is_active, true))
      .orderBy(desc(managementStaffTable.created_at))
      .limit(limit)
      .offset(offset)
      .execute();

    return results;
  } catch (error) {
    console.error('Management staff retrieval failed:', error);
    throw error;
  }
}

export async function getManagementStaffById(input: GetByIdInput): Promise<ManagementStaff | null> {
  try {
    const results = await db.select()
      .from(managementStaffTable)
      .where(eq(managementStaffTable.id, input.id))
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Management staff retrieval by ID failed:', error);
    throw error;
  }
}

export async function updateManagementStaff(input: UpdateManagementStaffInput): Promise<ManagementStaff> {
  try {
    const updateData: Record<string, any> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) updateData['name'] = input.name;
    if (input.position !== undefined) updateData['position'] = input.position;
    if (input.photo_url !== undefined) updateData['photo_url'] = input.photo_url;
    if (input.is_active !== undefined) updateData['is_active'] = input.is_active;

    const results = await db.update(managementStaffTable)
      .set(updateData)
      .where(eq(managementStaffTable.id, input.id))
      .returning()
      .execute();

    if (results.length === 0) {
      throw new Error(`Management staff with ID ${input.id} not found`);
    }

    return results[0];
  } catch (error) {
    console.error('Management staff update failed:', error);
    throw error;
  }
}

export async function deleteManagementStaff(input: DeleteByIdInput): Promise<{ success: boolean }> {
  try {
    const results = await db.delete(managementStaffTable)
      .where(eq(managementStaffTable.id, input.id))
      .returning()
      .execute();

    return { success: results.length > 0 };
  } catch (error) {
    console.error('Management staff deletion failed:', error);
    throw error;
  }
}