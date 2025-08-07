import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createMenuItemInputSchema,
  updateMenuItemInputSchema,
  getByIdSchema,
  deleteByIdSchema,
  updateAboutUsInputSchema,
  createDoctorInputSchema,
  updateDoctorInputSchema,
  paginationSchema,
  createManagementStaffInputSchema,
  updateManagementStaffInputSchema,
  createServiceInputSchema,
  updateServiceInputSchema,
  createNewsInputSchema,
  updateNewsInputSchema,
  createContactMessageInputSchema,
  updateContactMessageInputSchema
} from './schema';

// Import handlers
import {
  createMenuItem,
  getMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem
} from './handlers/menu_items';

import {
  getAboutUs,
  updateAboutUs
} from './handlers/about_us';

import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
} from './handlers/doctors';

import {
  createManagementStaff,
  getManagementStaff,
  getManagementStaffById,
  updateManagementStaff,
  deleteManagementStaff
} from './handlers/management_staff';

import {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService
} from './handlers/services';

import {
  createNews,
  getNews,
  getLatestNews,
  getNewsById,
  getAllNewsForAdmin,
  updateNews,
  deleteNews
} from './handlers/news';

import {
  createContactMessage,
  getContactMessages,
  getContactMessageById,
  markContactMessageAsRead,
  deleteContactMessage
} from './handlers/contact_messages';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Menu Items Routes
  createMenuItem: publicProcedure
    .input(createMenuItemInputSchema)
    .mutation(({ input }) => createMenuItem(input)),
  
  getMenuItems: publicProcedure
    .query(() => getMenuItems()),
  
  getMenuItemById: publicProcedure
    .input(getByIdSchema)
    .query(({ input }) => getMenuItemById(input)),
  
  updateMenuItem: publicProcedure
    .input(updateMenuItemInputSchema)
    .mutation(({ input }) => updateMenuItem(input)),
  
  deleteMenuItem: publicProcedure
    .input(deleteByIdSchema)
    .mutation(({ input }) => deleteMenuItem(input)),

  // About Us Routes
  getAboutUs: publicProcedure
    .query(() => getAboutUs()),
  
  updateAboutUs: publicProcedure
    .input(updateAboutUsInputSchema)
    .mutation(({ input }) => updateAboutUs(input)),

  // Doctor Routes
  createDoctor: publicProcedure
    .input(createDoctorInputSchema)
    .mutation(({ input }) => createDoctor(input)),
  
  getDoctors: publicProcedure
    .input(paginationSchema.optional())
    .query(({ input }) => getDoctors(input)),
  
  getDoctorById: publicProcedure
    .input(getByIdSchema)
    .query(({ input }) => getDoctorById(input)),
  
  updateDoctor: publicProcedure
    .input(updateDoctorInputSchema)
    .mutation(({ input }) => updateDoctor(input)),
  
  deleteDoctor: publicProcedure
    .input(deleteByIdSchema)
    .mutation(({ input }) => deleteDoctor(input)),

  // Management Staff Routes
  createManagementStaff: publicProcedure
    .input(createManagementStaffInputSchema)
    .mutation(({ input }) => createManagementStaff(input)),
  
  getManagementStaff: publicProcedure
    .input(paginationSchema.optional())
    .query(({ input }) => getManagementStaff(input)),
  
  getManagementStaffById: publicProcedure
    .input(getByIdSchema)
    .query(({ input }) => getManagementStaffById(input)),
  
  updateManagementStaff: publicProcedure
    .input(updateManagementStaffInputSchema)
    .mutation(({ input }) => updateManagementStaff(input)),
  
  deleteManagementStaff: publicProcedure
    .input(deleteByIdSchema)
    .mutation(({ input }) => deleteManagementStaff(input)),

  // Service Routes
  createService: publicProcedure
    .input(createServiceInputSchema)
    .mutation(({ input }) => createService(input)),
  
  getServices: publicProcedure
    .input(paginationSchema.optional())
    .query(({ input }) => getServices(input)),
  
  getServiceById: publicProcedure
    .input(getByIdSchema)
    .query(({ input }) => getServiceById(input)),
  
  updateService: publicProcedure
    .input(updateServiceInputSchema)
    .mutation(({ input }) => updateService(input)),
  
  deleteService: publicProcedure
    .input(deleteByIdSchema)
    .mutation(({ input }) => deleteService(input)),

  // News Routes
  createNews: publicProcedure
    .input(createNewsInputSchema)
    .mutation(({ input }) => createNews(input)),
  
  getNews: publicProcedure
    .input(paginationSchema.optional())
    .query(({ input }) => getNews(input)),
  
  getLatestNews: publicProcedure
    .query(() => getLatestNews()),
  
  getNewsById: publicProcedure
    .input(getByIdSchema)
    .query(({ input }) => getNewsById(input)),
  
  getAllNewsForAdmin: publicProcedure
    .input(paginationSchema.optional())
    .query(({ input }) => getAllNewsForAdmin(input)),
  
  updateNews: publicProcedure
    .input(updateNewsInputSchema)
    .mutation(({ input }) => updateNews(input)),
  
  deleteNews: publicProcedure
    .input(deleteByIdSchema)
    .mutation(({ input }) => deleteNews(input)),

  // Contact Message Routes
  createContactMessage: publicProcedure
    .input(createContactMessageInputSchema)
    .mutation(({ input }) => createContactMessage(input)),
  
  getContactMessages: publicProcedure
    .input(paginationSchema.optional())
    .query(({ input }) => getContactMessages(input)),
  
  getContactMessageById: publicProcedure
    .input(getByIdSchema)
    .query(({ input }) => getContactMessageById(input)),
  
  markContactMessageAsRead: publicProcedure
    .input(updateContactMessageInputSchema)
    .mutation(({ input }) => markContactMessageAsRead(input)),
  
  deleteContactMessage: publicProcedure
    .input(deleteByIdSchema)
    .mutation(({ input }) => deleteContactMessage(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();