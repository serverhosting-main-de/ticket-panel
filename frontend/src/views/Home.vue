<template>
    <div class="home-container">
        <div class="content">
            <h1>Willkommen bei Wonder-Craft Tickets</h1>
            <p class="description">Siehe deine alten Tickets noch einmal an</p>

            <!-- Zeige Login-Button nur, wenn der Benutzer nicht eingeloggt ist -->
            <button v-if="!user && !isLoading" @click="loginWithDiscord" class="login-button">
                Mit Discord anmelden
            </button>

            <!-- Ladeanimation, während der Benutzerstatus überprüft wird -->
            <div v-if="isLoading" class="loading-spinner">
                <div class="spinner"></div>
                <p>Überprüfe Anmeldestatus...</p>
            </div>

            <!-- Weiterleitungshinweis, wenn der Benutzer eingeloggt ist -->
            <div v-if="user" class="redirect-message">
                <p>Du bist bereits eingeloggt. Weiterleitung zum Dashboard...</p>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            user: null, // Speichert die Benutzerdaten
            isLoading: true, // Ladezustand für die Überprüfung des Benutzerstatus
        };
    },
    created() {
        this.checkUserStatus(); // Überprüft den Benutzerstatus beim Laden der Komponente
    },
    methods: {
        async checkUserStatus() {
            try {
                const storedUser = localStorage.getItem("user");
                if (storedUser) {
                    this.user = JSON.parse(storedUser);
                    this.$router.push("/dashboard"); // Weiterleitung zum Dashboard
                }
            } catch (error) {
                console.error("Fehler beim Überprüfen des Benutzerstatus:", error);
            } finally {
                this.isLoading = false; // Ladezustand beenden
            }
        },
        loginWithDiscord() {
            window.location.href = "http://backendtickets.wonder-craft.de/auth/discord";
        },
    },
};
</script>

<style scoped>
/* Grundlegende Stile */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Arial', sans-serif;
}

body {
    background-color: #1a1d23;
    color: #e4e7eb;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
}

.home-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    text-align: center;
}

.content {
    background-color: #353b48;
    color: #f1f1f1;
    border-radius: 15px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
    padding: 40px;
    width: 90%;
    max-width: 450px;
    animation: fadeIn 0.5s ease-in-out;
}

h1 {
    font-size: 2.5rem;
    margin-bottom: 20px;
    font-weight: bold;
    color: #fff;
}

.description {
    font-size: 1.2rem;
    margin-bottom: 25px;
    color: #b1bbc5;
}

button {
    padding: 12px 30px;
    background-color: #7289da;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 30px;
    font-size: 1.2rem;
    transition: background-color 0.3s ease, transform 0.2s ease;
    width: 100%;
    max-width: 250px;
    margin-top: 20px;
}

button:hover {
    background-color: #5a6eb3;
    transform: translateY(-3px);
}

button:active {
    transform: translateY(2px);
}

/* Ladeanimation */
.loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 20px;
}

.spinner {
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid #7289da;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

/* Weiterleitungshinweis */
.redirect-message {
    margin-top: 20px;
    font-size: 1.1rem;
    color: #b1bbc5;
}

/* Animation für das Einblenden der Komponente */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>