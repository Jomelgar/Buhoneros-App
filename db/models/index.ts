import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Definir tablas de la base de datos aqui

//Un ejemplo de como se define una tabla en drizzle
export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});


