<template>
    <div class="not-found-container">
        <h1>404 - Seite nicht gefunden</h1>
        <p>Die angeforderte Seite existiert nicht.</p>
        <router-link to="/" class="home-link">Zurück zur Startseite</router-link>
    </div>
</template>

<script>
export default {
    name: "NotFound",
};
</script>

<style scoped>
.not-found-container {
    text-align: center;
    padding: 20px;
}

h1 {
    font-size: 2.5rem;
    margin-bottom: 20px;
}

p {
    font-size: 1.2rem;
    margin-bottom: 20px;
}

.home-link {
    color: #7289da;
    text-decoration: none;
    font-size: 1.1rem;
}

.home-link:hover {
    text-decoration: underline;
}
</style>