import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API, withCredentials: true });

// Auth
export const authLogin = (email, password) => api.post('/auth/login', { email, password }).then(r => r.data);
export const authRegister = (email, password, name) => api.post('/auth/register', { email, password, name }).then(r => r.data);
export const authLogout = () => api.post('/auth/logout').then(r => r.data);
export const authMe = () => api.get('/auth/me').then(r => r.data);
export const authRefresh = () => api.post('/auth/refresh').then(r => r.data);

// Projects
export const fetchProjects = () => api.get('/projects').then(r => r.data);
export const fetchProject = (id) => api.get(`/projects/${id}`).then(r => r.data);
export const createProject = (data) => api.post('/projects', data).then(r => r.data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data).then(r => r.data);
export const deleteProject = (id) => api.delete(`/projects/${id}`).then(r => r.data);
export const updatePhase = (projectId, phaseId, data) => api.patch(`/projects/${projectId}/phases/${phaseId}`, data).then(r => r.data);
export const updateStep = (projectId, phaseId, stepId, data) => api.patch(`/projects/${projectId}/phases/${phaseId}/steps/${stepId}`, data).then(r => r.data);
export const exportProjectCSV = (projectId) => api.get(`/projects/${projectId}/export`, { responseType: 'blob' }).then(r => r.data);

// Template
export const fetchNPDTemplate = () => api.get('/template/npd').then(r => r.data);

// Colors
export const fetchColors = () => api.get('/colors').then(r => r.data);
export const createColor = (data) => api.post('/colors', data).then(r => r.data);
export const deleteColor = (id) => api.delete(`/colors/${id}`).then(r => r.data);

// Manufacturers
export const fetchManufacturers = () => api.get('/manufacturers').then(r => r.data);
export const createManufacturer = (data) => api.post('/manufacturers', data).then(r => r.data);
export const updateManufacturerRating = (id, field, value) => api.patch(`/manufacturers/${id}/rating`, { field, value }).then(r => r.data);
export const deleteManufacturer = (id) => api.delete(`/manufacturers/${id}`).then(r => r.data);

// Analytics & Seed
export const fetchMetrics = () => api.get('/analytics/metrics').then(r => r.data);
export const seedData = () => api.post('/seed').then(r => r.data);
