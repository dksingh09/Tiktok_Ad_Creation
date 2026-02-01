// src/__tests__/middleware.test.js
const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');

const tmpDir = path.resolve(__dirname, '..', 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const TEST_DB = path.join(tmpDir, 'test-db.json');
const INITIAL_DB = path.resolve(process.cwd(), 'db.initial.json');

beforeEach(() => {
  // copy initial db to test db
  fs.copyFileSync(INITIAL_DB, TEST_DB);
  process.env.DB_JSON_FILE = TEST_DB;
});

afterEach(() => {
  delete require.cache[require.resolve('../middleware')];
  process.env.DB_JSON_FILE = '';
});

test('POST /api/oauth/token returns tokens', async () => {
  const middleware = require('../middleware');
  const app = express();
  app.use(express.json());
  app.use('/api', middleware);

  const res = await request(app).post('/api/oauth/token').send({ code: 'any' });
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('access_token');
  expect(res.body).toHaveProperty('refresh_token');
});

test('POST /api/ads validates and persists ad', async () => {
  const middleware = require('../middleware');
  const app = express();
  app.use(express.json());
  app.use('/api', middleware);

  const validAd = { campaignName: 'My Campaign', objective: 'traffic', adText: 'Nice creative', cta: 'Learn More', musicOption: 'none' };
  const res = await request(app).post('/api/ads').send(validAd);
  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);

  // check test db file
  const db = JSON.parse(fs.readFileSync(TEST_DB, 'utf-8'));
  expect(Array.isArray(db.ads)).toBe(true);
  expect(db.ads.length).toBe(1);
  expect(db.ads[0].campaign_name).toBe('My Campaign');
});

test('POST /api/ads returns validation errors for bad input', async () => {
  const middleware = require('../middleware');
  const app = express();
  app.use(express.json());
  app.use('/api', middleware);

  const invalidAd = { campaignName: 'A', objective: 'invalid', adText: '' };
  const res = await request(app).post('/api/ads').send(invalidAd);
  expect(res.statusCode).toBe(400);
  expect(res.body.type).toBe('validation');
  expect(Array.isArray(res.body.errors)).toBe(true);
});

test('GET /api/music/validate/:id returns valid/invalid', async () => {
  const middleware = require('../middleware');
  const app = express();
  app.use(express.json());
  app.use('/api', middleware);

  const res1 = await request(app).get('/api/music/validate/music_001');
  expect(res1.statusCode).toBe(200);
  expect(res1.body.success).toBe(true);
  expect(res1.body.valid).toBe(true);

  const res2 = await request(app).get('/api/music/validate/music_unknown');
  expect(res2.statusCode).toBe(200);
  expect(res2.body.success).toBe(false);
});

test('POST /api/__admin/reset restores DB', async () => {
  const middleware = require('../middleware');
  const app = express();
  app.use(express.json());
  app.use('/api', middleware);

  // add an ad
  const validAd = { campaignName: 'My Campaign', objective: 'traffic', adText: 'Nice creative', cta: 'Learn More', musicOption: 'none' };
  const createRes = await request(app).post('/api/ads').send(validAd);
  expect(createRes.statusCode).toBe(200);
  const adId = createRes.body.data.creative.ad_id;

  let db = JSON.parse(fs.readFileSync(TEST_DB, 'utf-8'));
  expect(db.ads.length).toBe(1);

  // fetch via GET /ads/:id
  const getRes = await request(app).get(`/api/ads/${adId}`);
  expect(getRes.statusCode).toBe(200);
  expect(getRes.body.success).toBe(true);
  expect(getRes.body.data.ad.ad_id).toBe(adId);

  // reset
  const resetRes = await request(app).post('/api/__admin/reset').send();
  expect(resetRes.statusCode).toBe(200);

  db = JSON.parse(fs.readFileSync(TEST_DB, 'utf-8'));
  expect(db.ads.length).toBe(0);
});