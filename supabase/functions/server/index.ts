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

// Enable logger
app.use('*', logger(console.log));

// CORS para el cliente web
app.use("*", async (c, next) => {
  const origin = c.req.header("Origin") || "*";
  
  // Set CORS headers for all requests
  c.res.headers.set("Access-Control-Allow-Origin", origin);
  c.res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  c.res.headers.set("Access-Control-Expose-Headers", "Content-Length");
  c.res.headers.set("Access-Control-Max-Age", "600");
  c.res.headers.set("Access-Control-Allow-Credentials", "true");
  
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

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

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
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const entry = {
      id,
      ...body,
      submitted_at: new Date().toISOString()
    };
    
    await kv.set(`participation:${id}`, entry);
    return c.json({ success: true, id });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Newsletter subscription
app.post("/subscribe", async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) return c.json({ error: "Email required" }, 400);
    
    // Check if exists
    const existing = await kv.get(`subscriber:${email}`);
    if (existing) {
      return c.json({ message: "Already subscribed" });
    }

    const entry = {
      email,
      subscribed_at: new Date().toISOString()
    };
    
    await kv.set(`subscriber:${email}`, entry);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);