<!-- Home.vue -->
<template>
    <div>
        <h1>Willkommen bei Wonder-Craft Tickets</h1>
        <button @click="loginWithDiscord">Mit Discord anmelden</button>
    </div>
</template>

<script>
export default {
    methods: {
        loginWithDiscord() {
            // Redirect zum Backend, um die Authentifizierung zu starten
            window.location.href = "http://backendtickets.wonder-craft.de/auth/discord";
        },
    },
};
</script>

<style scoped>
button {
    padding: 10px 20px;
    background-color: #7289da;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 5px;
}
</style>