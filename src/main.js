import { createApp } from 'vue'
import { createWebHistory, createRouter } from 'vue-router'
import App from './App.vue'
import FloChart from "@/components/FloChart";
import HomePage from "@/components/HomePage";

const routes = [
    { path: '/flo', name: 'flo', component: FloChart},
    {path: '/', name: 'home', component: HomePage},
]

const router = createRouter({
    history: createWebHistory(),
    routes
});

createApp(App).use(router).mount('#app')