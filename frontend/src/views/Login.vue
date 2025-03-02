<!-- Login.vue -->
<template>
    <div>
        <h1>Bitte melde dich an</h1>
        <button @click="loginWithDiscord">Mit Discord anmelden</button>
    </div>
</template>

<script>
export default {
    methods: {
        loginWithDiscord() {
            // Weiterleitung zur Discord-Login-Seite
            window.location.href = "http://tickets.wonder-craft.de:3000/auth/discord";
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