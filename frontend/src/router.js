import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import Dashboard from "./views/Dashboard.vue";

// Routen definieren
const routes = [
  {
    path: "/",
    component: Home,
    meta: { title: "Home - Wonder-Craft Tickets" }, // Titel für die Seite
  },
  {
    path: "/dashboard",
    component: Dashboard,
    meta: { requiresAuth: true, title: "Dashboard - Wonder-Craft Tickets" }, // Geschützte Route mit Titel
  },
  {
    path: "/:pathMatch(.*)*", // Fallback für 404-Seite
    component: () => import("./views/NotFound.vue"), // Importiere die 404-Komponente
    meta: { title: "404 - Seite nicht gefunden" },
  },
];

// Router erstellen
const router = createRouter({
  history: createWebHistory(),
  routes,
});

/**
 * Navigation Guard: Überprüft, ob der Benutzer authentifiziert ist.
 */
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem("user"); // Einfacher Auth-Check

  // Überprüfen, ob die Route Authentifizierung erfordert
  if (to.meta.requiresAuth && !isAuthenticated) {
    next("/"); // Wenn nicht authentifiziert, zurück zur Home-Seite (Login-Seite)
  } else {
    next(); // Fortfahren
  }
});

/**
 * Setzt den Seitentitel basierend auf der Meta-Information der Route.
 */
router.afterEach((to) => {
  const title = to.meta.title || "Wonder-Craft Tickets"; // Standardtitel
  document.title = title; // Seitentitel aktualisieren
});

export default router;
