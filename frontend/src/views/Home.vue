<template>
    <div class="home-container">
        <div class="content">
            <h1>Willkommen bei Wonder-Craft Tickets</h1>
            <p class="description">Siehe deine alten Tickets noch einmal an</p>

            <button v-if="!user && !isLoading" @click="loginWithDiscord" class="login-button">
                Mit Discord anmelden
            </button>

            <div v-if="isLoading" class="loading-spinner">
                <div class="spinner"></div>
                <p>Überprüfe Anmeldestatus...</p>
            </div>

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
            user: null,
            isLoading: true,
        };
    },
    created() {
        console.log("Home wird geladen...");
        this.checkUserStatus();
    },
    methods: {
        async checkUserStatus() {
            try {
                const token = document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1"); // Cookie abrufen
                if (token) {
                    const response = await fetch("http://backendtickets.wonder-craft.de/auth/user", {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    if (response.ok) {
                        this.user = await response.json();
                        this.$router.push("/dashboard");
                    } else {
                        console.log("Benutzer nicht eingeloggt");
                    }
                }
            } catch (error) {
                console.error("Fehler beim Überprüfen des Benutzerstatus:", error);
            } finally {
                this.isLoading = false;
            }
        },
        loginWithDiscord() {
            window.location.href = "http://backendtickets.wonder-craft.de/auth/discord";
        },
    },
};
</script>

<style scoped>
.home-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
    text-align: center;
    background-color: #1a1d23;
    color: #e4e7eb;
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

.login-button {
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

.login-button:hover {
    background-color: #5a6eb3;
    transform: translateY(-3px);
}

.login-button:active {
    transform: translateY(2px);
}

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

.redirect-message {
    margin-top: 20px;
    font-size: 1.1rem;
    color: #b1bbc5;
}

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