import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  boolean, 
  integer,
  json
} from 'drizzle-orm/pg-core';

// Menu Navigation Table
export const menuItemsTable = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  order_index: integer('order_index').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// About Us (Hospital History) Table
export const aboutUsTable = pgTable('about_us', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Doctor Profile Table
export const doctorsTable = pgTable('doctors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  specialization: text('specialization').notNull(),
  photo_url: text('photo_url'), // Nullable by default
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Management Staff Table
export const managementStaffTable = pgTable('management_staff', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  position: text('position').notNull(),
  photo_url: text('photo_url'), // Nullable by default
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Services Table
export const servicesTable = pgTable('services', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  image_url: text('image_url'), // Nullable by default
  facilities: json('facilities').$type<string[]>().notNull().default([]), // JSON array of strings
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// News Table
export const newsTable = pgTable('news', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  image_url: text('image_url'), // Nullable by default
  is_published: boolean('is_published').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Contact Messages Table
export const contactMessagesTable = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  is_read: boolean('is_read').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type MenuItem = typeof menuItemsTable.$inferSelect;
export type NewMenuItem = typeof menuItemsTable.$inferInsert;

export type AboutUs = typeof aboutUsTable.$inferSelect;
export type NewAboutUs = typeof aboutUsTable.$inferInsert;

export type Doctor = typeof doctorsTable.$inferSelect;
export type NewDoctor = typeof doctorsTable.$inferInsert;

export type ManagementStaff = typeof managementStaffTable.$inferSelect;
export type NewManagementStaff = typeof managementStaffTable.$inferInsert;

export type Service = typeof servicesTable.$inferSelect;
export type NewService = typeof servicesTable.$inferInsert;

export type News = typeof newsTable.$inferSelect;
export type NewNews = typeof newsTable.$inferInsert;

export type ContactMessage = typeof contactMessagesTable.$inferSelect;
export type NewContactMessage = typeof contactMessagesTable.$inferInsert;

// Export all tables for proper query building and relations
export const tables = {
  menuItems: menuItemsTable,
  aboutUs: aboutUsTable,
  doctors: doctorsTable,
  managementStaff: managementStaffTable,
  services: servicesTable,
  news: newsTable,
  contactMessages: contactMessagesTable,
};