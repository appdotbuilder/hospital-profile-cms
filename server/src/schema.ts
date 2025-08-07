import { z } from 'zod';

// Menu Navigation Schema
export const menuItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  url: z.string(),
  order_index: z.number().int(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type MenuItem = z.infer<typeof menuItemSchema>;

export const createMenuItemInputSchema = z.object({
  title: z.string(),
  url: z.string(),
  order_index: z.number().int(),
  is_active: z.boolean().default(true)
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemInputSchema>;

export const updateMenuItemInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  url: z.string().optional(),
  order_index: z.number().int().optional(),
  is_active: z.boolean().optional()
});

export type UpdateMenuItemInput = z.infer<typeof updateMenuItemInputSchema>;

// About Us (Hospital History) Schema
export const aboutUsSchema = z.object({
  id: z.number(),
  content: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type AboutUs = z.infer<typeof aboutUsSchema>;

export const updateAboutUsInputSchema = z.object({
  content: z.string()
});

export type UpdateAboutUsInput = z.infer<typeof updateAboutUsInputSchema>;

// Doctor Profile Schema
export const doctorSchema = z.object({
  id: z.number(),
  name: z.string(),
  specialization: z.string(),
  photo_url: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Doctor = z.infer<typeof doctorSchema>;

export const createDoctorInputSchema = z.object({
  name: z.string(),
  specialization: z.string(),
  photo_url: z.string().nullable().optional(),
  is_active: z.boolean().default(true)
});

export type CreateDoctorInput = z.infer<typeof createDoctorInputSchema>;

export const updateDoctorInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  specialization: z.string().optional(),
  photo_url: z.string().nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdateDoctorInput = z.infer<typeof updateDoctorInputSchema>;

// Management Staff Schema
export const managementStaffSchema = z.object({
  id: z.number(),
  name: z.string(),
  position: z.string(),
  photo_url: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ManagementStaff = z.infer<typeof managementStaffSchema>;

export const createManagementStaffInputSchema = z.object({
  name: z.string(),
  position: z.string(),
  photo_url: z.string().nullable().optional(),
  is_active: z.boolean().default(true)
});

export type CreateManagementStaffInput = z.infer<typeof createManagementStaffInputSchema>;

export const updateManagementStaffInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  position: z.string().optional(),
  photo_url: z.string().nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdateManagementStaffInput = z.infer<typeof updateManagementStaffInputSchema>;

// Service Schema
export const serviceSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  image_url: z.string().nullable(),
  facilities: z.array(z.string()),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Service = z.infer<typeof serviceSchema>;

export const createServiceInputSchema = z.object({
  title: z.string(),
  description: z.string(),
  image_url: z.string().nullable().optional(),
  facilities: z.array(z.string()).default([]),
  is_active: z.boolean().default(true)
});

export type CreateServiceInput = z.infer<typeof createServiceInputSchema>;

export const updateServiceInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().nullable().optional(),
  facilities: z.array(z.string()).optional(),
  is_active: z.boolean().optional()
});

export type UpdateServiceInput = z.infer<typeof updateServiceInputSchema>;

// News Schema
export const newsSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  image_url: z.string().nullable(),
  is_published: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type News = z.infer<typeof newsSchema>;

export const createNewsInputSchema = z.object({
  title: z.string(),
  content: z.string(),
  image_url: z.string().nullable().optional(),
  is_published: z.boolean().default(false)
});

export type CreateNewsInput = z.infer<typeof createNewsInputSchema>;

export const updateNewsInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  content: z.string().optional(),
  image_url: z.string().nullable().optional(),
  is_published: z.boolean().optional()
});

export type UpdateNewsInput = z.infer<typeof updateNewsInputSchema>;

// Contact Form Schema
export const contactMessageSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  subject: z.string(),
  message: z.string(),
  is_read: z.boolean(),
  created_at: z.coerce.date()
});

export type ContactMessage = z.infer<typeof contactMessageSchema>;

export const createContactMessageInputSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  subject: z.string(),
  message: z.string()
});

export type CreateContactMessageInput = z.infer<typeof createContactMessageInputSchema>;

export const updateContactMessageInputSchema = z.object({
  id: z.number(),
  is_read: z.boolean()
});

export type UpdateContactMessageInput = z.infer<typeof updateContactMessageInputSchema>;

// Query Parameters Schema
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10)
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export const getByIdSchema = z.object({
  id: z.number().int().positive()
});

export type GetByIdInput = z.infer<typeof getByIdSchema>;

export const deleteByIdSchema = z.object({
  id: z.number().int().positive()
});

export type DeleteByIdInput = z.infer<typeof deleteByIdSchema>;