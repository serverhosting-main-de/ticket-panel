import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import Dashboard from "./views/Dashboard.vue";

const routes = [
  {
    path: "/",
    component: Home,
    meta: { title: "Home - Wonder-Craft Tickets" },
  },
  {
    path: "/dashboard",
    component: Dashboard,
    meta: { title: "Dashboard - Wonder-Craft Tickets" },
  },
  {
    path: "/:pathMatch(.*)*",
    component: () => import("./views/NotFound.vue"),
    meta: { title: "404 - Seite nicht gefunden" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = document.cookie.includes("token=");

  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log("Nicht authentifiziert, Weiterleitung zur Home-Seite.");
    next("/");
  } else {
    next();
  }
});

router.afterEach((to) => {
  const title = to.meta.title || "Wonder-Craft Tickets";
  document.title = title;
});

export default router;
