import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import Dashboard from "./views/Dashboard.vue";
import Login from "./views/Login.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/dashboard", component: Dashboard, meta: { requiresAuth: true } }, // geschützte Route
  { path: "/login", component: Login },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Optional: Navigation Guard für Authentifizierung
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem("user"); // Einfaches Auth-Check
  if (to.meta.requiresAuth && !isAuthenticated) {
    next("/login");
  } else {
    next();
  }
});

export default router;
