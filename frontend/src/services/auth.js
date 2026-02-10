import axios from 'axios';
const api = axios.create({ baseURL: '/api' });
export function register(payload){ return api.post('/auth/register', payload); }
export function login(payload){ return api.post('/auth/login', payload); }