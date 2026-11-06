import { Hono } from "jsr:@hono/hono@^4.0.0";
import { cors } from "jsr:@hono/hono@^4.0.0/cors";
import { logger } from "jsr:@hono/hono@^4.0.0/logger";
import * as kv from "./db.ts";
import * as data from "./data.ts";

const GREEN_AREAS_DATA = data.GREEN_AREAS_DATA || [];
const PROJECTS_DATA = data.PROJECTS_DATA || [];
const GAZETTES_DATA = data.GAZETTES_DATA || [];
const EVENTS_DATA = data.EVENTS_DATA || [];
const PAST_EVENTS_DATA = data.PAST_EVENTS_DATA || [];

const app = new Hono();

// Request id for tracing in logs
app.use("*", async (c, next) => {
  const incoming = c.req.header("x-request-id");
  const requestId = incoming && incoming.trim() ? incoming.trim() : crypto.randomUUID();
  c.set("requestId", requestId);
  c.res.headers.set("X-Request-Id", requestId);
  await next();
});

// Enable logger
app.use('*', logger(console.log));

// CORS para el cliente web
app.use("*", async (c, next) => {
  const origin = c.req.header("Origin");
  
  // Set CORS headers for all requests
  if (origin) {
    c.res.headers.set("Access-Control-Allow-Origin", origin);
    c.res.headers.set("Access-Control-Allow-Credentials", "true");
  } else {
    c.res.headers.set("Access-Control-Allow-Origin", "*");
  }
  c.res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  c.res.headers.set("Access-Control-Expose-Headers", "Content-Length, X-Request-Id");
  c.res.headers.set("Access-Control-Max-Age", "600");
  
  // Handle preflight requests
  if (c.req.method === "OPTIONS") {
    return c.text("", 204);
  }
  
  await next();
});

const PREFIX_MAP = {
  'green_areas': 'green_area',
  'projects': 'project',
  'gazettes': 'gazette',
  'events': 'event',
  'past_events': 'past_event'
};

// Health check (verifies database connectivity)
app.get("/health", async (c) => {
  const requestId = c.get("requestId");
  try {
    await kv.healthCheck();
    return c.json({ status: "ok", request_id: requestId });
  } catch (error) {
    console.error(`[${requestId}] health check failed:`, error);
    return c.json({ status: "error", request_id: requestId }, 503);
  }
});

// Seed endpoint
app.post("/seed", async (c) => {
  try {
    // Check if data exists (naive check on one type)
    const existing = await kv.getByPrefix("green_area:");
    if (existing.length > 0) {
      return c.json({ message: "Data already seeded" });
    }

    // Seed Green Areas
    const greenAreas = GREEN_AREAS_DATA.map(item => ({ 
      key: `green_area:${item.id}`, 
      value: item 
    }));
    await kv.mset(greenAreas.map(i => i.key), greenAreas.map(i => i.value));

    // Seed Projects
    const projects = PROJECTS_DATA.map(item => ({ 
      key: `project:${item.id}`, 
      value: item 
    }));
    await kv.mset(projects.map(i => i.key), projects.map(i => i.value));

    // Seed Gazettes
    const gazettes = GAZETTES_DATA.map(item => ({ 
      key: `gazette:${item.id}`, 
      value: item 
    }));
    await kv.mset(gazettes.map(i => i.key), gazettes.map(i => i.value));

    // Seed Events
    const events = EVENTS_DATA.map(item => ({ 
      key: `event:${item.id}`, 
      value: item 
    }));
    await kv.mset(events.map(i => i.key), events.map(i => i.value));

    // Seed Past Events
    const pastEvents = PAST_EVENTS_DATA.map(item => ({ 
      key: `past_event:${item.id}`, 
      value: item 
    }));
    await kv.mset(pastEvents.map(i => i.key), pastEvents.map(i => i.value));

    return c.json({ message: "Seeding complete", counts: {
      green_areas: greenAreas.length,
      projects: projects.length,
      gazettes: gazettes.length,
      events: events.length
    }});
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Generic GET for collections
app.get("/data/:type", async (c) => {
  const type = c.req.param("type");
  const prefix = PREFIX_MAP[type];
  
  if (!prefix) {
    return c.json({ error: "Invalid type" }, 400);
  }

  try {
    const data = await kv.getByPrefix(prefix + ":");
    return c.json(data);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Participation submission
app.post("/participation", async (c) => {
  const requestId = c.get("requestId");
  try {
    const body = await c.req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return c.json({ error: "Cuerpo inválido", request_id: requestId }, 400);
    }
    // Basic size guard to avoid oversized payloads
    const serialized = JSON.stringify(body);
    if (serialized.length > 50_000) {
      return c.json({ error: "Cuerpo demasiado grande", request_id: requestId }, 413);
    }
    const id = crypto.randomUUID();
    const entry = {
      id,
      ...body,
      submitted_at: new Date().toISOString()
    };

    await kv.set(`participation:${id}`, entry);
    return c.json({ success: true, id, request_id: requestId });
  } catch (error) {
    console.error(`[${requestId}] participation error:`, error);
    return c.json({ error: error instanceof Error ? error.message : "Error", request_id: requestId }, 500);
  }
});

// Newsletter subscription
app.post("/subscribe", async (c) => {
  const requestId = c.get("requestId");
  try {
    const body = await c.req.json().catch(() => null);
    const email = body?.email;
    if (!email || typeof email !== "string" || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.trim())) {
      return c.json({ error: "Email inválido", request_id: requestId }, 400);
    }
    const normalized = email.trim().toLowerCase();

    // Check if exists
    const existing = await kv.get(`subscriber:${normalized}`);
    if (existing) {
      return c.json({ message: "Already subscribed", request_id: requestId });
    }

    const entry = {
      email: normalized,
      subscribed_at: new Date().toISOString()
    };

    await kv.set(`subscriber:${normalized}`, entry);
    return c.json({ success: true, request_id: requestId });
  } catch (error) {
    console.error(`[${requestId}] subscribe error:`, error);
    return c.json({ error: error instanceof Error ? error.message : "Error", request_id: requestId }, 500);
  }
});

Deno.serve(app.fetch);