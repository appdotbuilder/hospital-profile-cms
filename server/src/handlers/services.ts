import { db } from '../db';
import { servicesTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { 
  type CreateServiceInput, 
  type UpdateServiceInput, 
  type Service, 
  type DeleteByIdInput,
  type GetByIdInput,
  type PaginationInput 
} from '../schema';

export async function createService(input: CreateServiceInput): Promise<Service> {
  try {
    const result = await db.insert(servicesTable)
      .values({
        title: input.title,
        description: input.description,
        image_url: input.image_url,
        facilities: input.facilities,
        is_active: input.is_active
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Service creation failed:', error);
    throw error;
  }
}

export async function getServices(input?: PaginationInput): Promise<Service[]> {
  try {
    const baseQuery = db.select()
      .from(servicesTable)
      .where(eq(servicesTable.is_active, true));

    if (input) {
      const offset = (input.page - 1) * input.limit;
      const results = await baseQuery.limit(input.limit).offset(offset).execute();
      return results;
    }

    const results = await baseQuery.execute();
    return results;
  } catch (error) {
    console.error('Failed to fetch services:', error);
    throw error;
  }
}

export async function getServiceById(input: GetByIdInput): Promise<Service | null> {
  try {
    const results = await db.select()
      .from(servicesTable)
      .where(
        and(
          eq(servicesTable.id, input.id),
          eq(servicesTable.is_active, true)
        )
      )
      .execute();

    return results[0] || null;
  } catch (error) {
    console.error('Failed to fetch service by ID:', error);
    throw error;
  }
}

export async function updateService(input: UpdateServiceInput): Promise<Service> {
  try {
    // Build update object only with provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.image_url !== undefined) {
      updateData.image_url = input.image_url;
    }
    if (input.facilities !== undefined) {
      updateData.facilities = input.facilities;
    }
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    const result = await db.update(servicesTable)
      .set(updateData)
      .where(eq(servicesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Service with ID ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Service update failed:', error);
    throw error;
  }
}

export async function deleteService(input: DeleteByIdInput): Promise<{ success: boolean }> {
  try {
    const result = await db.delete(servicesTable)
      .where(eq(servicesTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Service deletion failed:', error);
    throw error;
  }
}