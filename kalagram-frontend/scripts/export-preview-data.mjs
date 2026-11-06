// Saves the public API's current content to public/preview-data.json, for the GitHub Pages preview.
// Run with the API running. Only public endpoints are read, so no registrations or enquiries are included.
import { writeFileSync } from 'node:fs';

const API = process.env.API_URL || 'http://localhost:8080/api';

async function get(path) {
  const response = await fetch(API + path);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

const workshops = await get('/workshops');
const resources = await get('/resources');

const workshopDetails = {};
for (const workshop of workshops) workshopDetails[workshop.slug] = await get(`/workshops/${workshop.slug}`);

const resourceDetails = {};
for (const resource of resources) resourceDetails[resource.slug] = await get(`/resources/${resource.slug}`);

const data = {
  workshops,
  workshopDetails,
  resources,
  resourceDetails,
  gallery: await get('/gallery'),
  resourceCategories: await get('/resource-categories'),
  settings: await get('/settings'),
};

writeFileSync(new URL('../public/preview-data.json', import.meta.url), JSON.stringify(data));
console.log(`Exported ${workshops.length} workshops, ${data.gallery.length} images, ${resources.length} resources.`);
