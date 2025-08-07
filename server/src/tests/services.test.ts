import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { 
  type CreateServiceInput, 
  type UpdateServiceInput, 
  type PaginationInput 
} from '../schema';
import { 
  createService, 
  getServices, 
  getServiceById, 
  updateService, 
  deleteService 
} from '../handlers/services';

// Test data
const testServiceInput: CreateServiceInput = {
  title: 'Emergency Care',
  description: 'Comprehensive emergency medical services available 24/7',
  image_url: 'https://example.com/emergency.jpg',
  facilities: ['ICU', 'Trauma Center', 'Ambulance Service'],
  is_active: true
};

const testServiceInput2: CreateServiceInput = {
  title: 'Maternity Ward',
  description: 'Complete maternity and prenatal care',
  image_url: null,
  facilities: ['Delivery Rooms', 'NICU', 'Postnatal Care'],
  is_active: true
};

describe('createService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a service with all fields', async () => {
    const result = await createService(testServiceInput);

    expect(result.id).toBeDefined();
    expect(result.title).toEqual('Emergency Care');
    expect(result.description).toEqual(testServiceInput.description);
    expect(result.image_url).toEqual('https://example.com/emergency.jpg');
    expect(result.facilities).toEqual(['ICU', 'Trauma Center', 'Ambulance Service']);
    expect(result.is_active).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a service with null image_url', async () => {
    const result = await createService(testServiceInput2);

    expect(result.title).toEqual('Maternity Ward');
    expect(result.image_url).toBeNull();
    expect(result.facilities).toEqual(['Delivery Rooms', 'NICU', 'Postnatal Care']);
  });

  it('should create a service with default is_active value', async () => {
    const input: CreateServiceInput = {
      title: 'Pharmacy',
      description: 'In-house pharmacy services',
      facilities: [],
      is_active: true
    };

    const result = await createService(input);

    expect(result.is_active).toBe(true); // Default value from Zod
    expect(result.facilities).toEqual([]); // Default empty array
  });

  it('should save service to database', async () => {
    const result = await createService(testServiceInput);

    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, result.id))
      .execute();

    expect(services).toHaveLength(1);
    expect(services[0].title).toEqual('Emergency Care');
    expect(services[0].facilities).toEqual(['ICU', 'Trauma Center', 'Ambulance Service']);
    expect(services[0].is_active).toBe(true);
  });
});

describe('getServices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all active services without pagination', async () => {
    // Create test services
    await createService(testServiceInput);
    await createService(testServiceInput2);
    
    // Create inactive service
    const inactiveService: CreateServiceInput = {
      title: 'Inactive Service',
      description: 'This should not appear',
      facilities: [],
      is_active: false
    };
    await createService(inactiveService);

    const results = await getServices();

    expect(results).toHaveLength(2); // Only active services
    expect(results.find(s => s.title === 'Emergency Care')).toBeDefined();
    expect(results.find(s => s.title === 'Maternity Ward')).toBeDefined();
    expect(results.find(s => s.title === 'Inactive Service')).toBeUndefined();
  });

  it('should return paginated services', async () => {
    // Create multiple services
    await createService({ ...testServiceInput, title: 'Service 1' });
    await createService({ ...testServiceInput, title: 'Service 2' });
    await createService({ ...testServiceInput, title: 'Service 3' });

    const paginationInput: PaginationInput = {
      page: 1,
      limit: 2
    };

    const results = await getServices(paginationInput);

    expect(results).toHaveLength(2);
  });

  it('should return second page of results', async () => {
    // Create multiple services
    await createService({ ...testServiceInput, title: 'Service 1' });
    await createService({ ...testServiceInput, title: 'Service 2' });
    await createService({ ...testServiceInput, title: 'Service 3' });

    const paginationInput: PaginationInput = {
      page: 2,
      limit: 2
    };

    const results = await getServices(paginationInput);

    expect(results).toHaveLength(1); // Only one service on second page
  });

  it('should return empty array when no active services exist', async () => {
    const results = await getServices();
    expect(results).toHaveLength(0);
  });
});

describe('getServiceById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return service by ID', async () => {
    const created = await createService(testServiceInput);

    const result = await getServiceById({ id: created.id });

    expect(result).toBeDefined();
    expect(result!.id).toEqual(created.id);
    expect(result!.title).toEqual('Emergency Care');
    expect(result!.facilities).toEqual(['ICU', 'Trauma Center', 'Ambulance Service']);
  });

  it('should return null for non-existent ID', async () => {
    const result = await getServiceById({ id: 999 });
    expect(result).toBeNull();
  });

  it('should not return inactive services', async () => {
    const inactiveService: CreateServiceInput = {
      title: 'Inactive Service',
      description: 'This should not be returned',
      facilities: [],
      is_active: false
    };
    const created = await createService(inactiveService);

    const result = await getServiceById({ id: created.id });

    expect(result).toBeNull();
  });
});

describe('updateService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update service title and description', async () => {
    const created = await createService(testServiceInput);

    const updateInput: UpdateServiceInput = {
      id: created.id,
      title: 'Updated Emergency Care',
      description: 'Updated description for emergency services'
    };

    const result = await updateService(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.title).toEqual('Updated Emergency Care');
    expect(result.description).toEqual('Updated description for emergency services');
    expect(result.facilities).toEqual(created.facilities); // Unchanged
    expect(result.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
  });

  it('should update facilities array', async () => {
    const created = await createService(testServiceInput);

    const updateInput: UpdateServiceInput = {
      id: created.id,
      facilities: ['Updated ICU', 'New Facility']
    };

    const result = await updateService(updateInput);

    expect(result.facilities).toEqual(['Updated ICU', 'New Facility']);
    expect(result.title).toEqual(created.title); // Unchanged
  });

  it('should update is_active status', async () => {
    const created = await createService(testServiceInput);

    const updateInput: UpdateServiceInput = {
      id: created.id,
      is_active: false
    };

    const result = await updateService(updateInput);

    expect(result.is_active).toBe(false);
  });

  it('should update image_url to null', async () => {
    const created = await createService(testServiceInput);

    const updateInput: UpdateServiceInput = {
      id: created.id,
      image_url: null
    };

    const result = await updateService(updateInput);

    expect(result.image_url).toBeNull();
  });

  it('should persist changes to database', async () => {
    const created = await createService(testServiceInput);

    const updateInput: UpdateServiceInput = {
      id: created.id,
      title: 'Database Updated Title'
    };

    await updateService(updateInput);

    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, created.id))
      .execute();

    expect(services[0].title).toEqual('Database Updated Title');
  });

  it('should throw error for non-existent service', async () => {
    const updateInput: UpdateServiceInput = {
      id: 999,
      title: 'Should fail'
    };

    expect(updateService(updateInput)).rejects.toThrow(/not found/i);
  });
});

describe('deleteService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete existing service', async () => {
    const created = await createService(testServiceInput);

    const result = await deleteService({ id: created.id });

    expect(result.success).toBe(true);

    // Verify service is deleted from database
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, created.id))
      .execute();

    expect(services).toHaveLength(0);
  });

  it('should return false for non-existent service', async () => {
    const result = await deleteService({ id: 999 });

    expect(result.success).toBe(false);
  });

  it('should remove service from active listings', async () => {
    const created = await createService(testServiceInput);

    await deleteService({ id: created.id });

    // Verify service no longer appears in active services
    const activeServices = await getServices();
    expect(activeServices.find(s => s.id === created.id)).toBeUndefined();
  });
});