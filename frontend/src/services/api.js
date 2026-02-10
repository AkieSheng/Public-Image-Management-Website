import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000
})

export const uploadImage = (formData) => {
  return api.post('/upload', formData)
}

export const getImages = () => {
  return api.get('/images')
}
