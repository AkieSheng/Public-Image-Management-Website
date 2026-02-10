import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import Gallery from '../views/Gallery.vue';
import Upload from '../views/Upload.vue';
import ImageDetail from '../views/ImageDetail.vue';
import Slideshow from '../views/Slideshow.vue';

const routes = [
  { path: '/', redirect: '/gallery' },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/gallery', component: Gallery, meta:{ auth:true } },
  { path: '/upload', component: Upload, meta:{ auth:true } },
  { path: '/image/:id', component: ImageDetail, meta:{ auth:true } },
  { path: '/slideshow', component: Slideshow, meta:{ auth:true } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to,from,next)=>{
  const token = localStorage.getItem('token') || '';
  if (to.path === '/login' || to.path === '/register') return next();
  if (to.meta.auth && !token) return next('/login');
  next();
});

export default router;
