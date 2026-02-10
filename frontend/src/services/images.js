import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// 每次请求前读取 localStorage 的 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function setToken(token){
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function uploadImage(file, onProgress, extra={}){
  const fd = new FormData();
  fd.append('image', file);
  if (extra.title) fd.append('title', extra.title);
  if (extra.tags)  fd.append('tags', Array.isArray(extra.tags) ? JSON.stringify(extra.tags) : String(extra.tags));
  return api.post('/images/upload', fd, { onUploadProgress: e=> onProgress?.(Math.round(e.loaded*100/e.total)) });
}

export function listImages(){ return api.get('/images'); }
export function getImage(id){ return api.get(`/images/${id}`); }
export function editImage(id, payload){ return api.post(`/images/${id}/edit`, payload); }
export function deleteImage(id){ return api.delete(`/images/${id}`); }
export function addTags(imageId, tags){ return api.post('/images/tags', { imageId, tags }); }
export function addTagsAppend(imageId, tags){ return api.post('/images/tags/append', { imageId, tags }); }

export function search(params){ return api.get('/search', { params }); }
export function updateMeta(id, payload){ return api.put(`/images/${id}/meta`, payload); }
export function aiTag(id){ return api.post(`/images/${id}/ai-tags`); }

export function mcpQuery(prompt){
  return api.post('/mcp/query', { prompt });
}
