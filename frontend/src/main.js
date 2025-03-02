// main.js
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router.js"; // Vue Router importieren

createApp(App)
  .use(router) // Router verwenden
  .mount("#app");
