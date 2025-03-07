import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import Dashboard from "./views/Dashboard.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/dashboard", component: Dashboard, meta: { requiresAuth: true } }, // geschützte Route
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Optional: Navigation Guard für Authentifizierung
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem("user"); // Einfacher Auth-Check
  if (to.meta.requiresAuth && !isAuthenticated) {
    next("/"); // Wenn nicht authentifiziert, zurück zur Home-Seite (Login-Seite)
  } else {
    next();
  }
});

export default router;
