<template>
    <div class="dashboard-container">
        <h1>Dashboard</h1>

        <div v-if="isLoading">
            <p>Lade Dashboard...</p>
        </div>

        <div v-else-if="error">
            <p>{{ error }}</p>
            <button @click="redirectToLogin">Zum Login</button>
        </div>

        <div v-else-if="user">
            <h2>Willkommen, {{ user.username }}</h2>
            <p><strong>Discord ID:</strong> {{ user.id }}</p>

            <h3>Deine Tickets</h3>
            <ul v-if="tickets.length > 0">
                <li v-for="ticket in tickets" :key="ticket.name">
                    <a :href="ticket.url" target="_blank">{{ ticket.name }}</a>
                </li>
            </ul>
            <p v-else>Du hast noch keine Tickets.</p>
        </div>

        <div v-else>
            <p>Du bist nicht eingeloggt. Bitte melde dich an.</p>
            <button @click="redirectToLogin">Zum Login</button>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            user: null,
            tickets: [],
            isLoading: true,
            error: null,
        };
    },
    created() {
        console.log("Dashboard wird geladen...");
        this.checkUserStatus();
    },
    methods: {
        async checkUserStatus() {
            console.log("Überprüfe Benutzerstatus...");
            this.isLoading = true;
            this.error = null;
            try {
                const token = this.getCookie("token");
                if (token) {
                    try {
                        // Versuche, das JWT zu dekodieren (optional, zur Überprüfung)
                        const decodedToken = JSON.parse(atob(token.split(".")[1]));
                        console.log("Dekodiertes JWT:", decodedToken);

                        // Überprüfe das Ablaufdatum des JWT (optional)
                        if (decodedToken.exp * 1000 < Date.now()) {
                            throw new Error("JWT ist abgelaufen.");
                        }

                        // JWT ist gültig, fahre mit dem Abrufen der Benutzerdaten fort
                        const response = await fetch("http://backendtickets.wonder-craft.de/auth/user", {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        });
                        if (response.ok) {
                            this.user = await response.json();
                            await this.fetchTickets();
                        } else {
                            const errorData = await response.json();
                            console.error(
                                "Fehler beim Abrufen der Benutzerdaten:",
                                response.status,
                                response.statusText,
                                errorData.message
                            );
                            this.error = `Fehler beim Laden der Benutzerdaten: ${errorData.message}`;
                        }
                    } catch (jwtError) {
                        console.error("JWT-Fehler:", jwtError);
                        this.error = "Ungültiges oder abgelaufenes JWT. Bitte melde dich erneut an.";
                    }
                } else {
                    this.error = "Nicht autorisiert. Bitte melde dich an.";
                }
            } catch (err) {
                console.error("Fehler beim Überprüfen des Benutzerstatus:", err);
                this.error = "Fehler beim Laden des Dashboards.";
            } finally {
                this.isLoading = false;
            }
        },
        async fetchTickets() {
            console.log("Lade Tickets...");
            try {
                const token = this.getCookie("token");
                const response = await fetch("http://backendtickets.wonder-craft.de/tickets", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    this.tickets = await response.json();
                } else {
                    const errorData = await response.json();
                    console.error(
                        "Fehler beim Abrufen der Tickets:",
                        response.status,
                        response.statusText,
                        errorData.message
                    );
                    this.error = `Fehler beim Laden der Tickets: ${errorData.message}`;
                }
            } catch (err) {
                console.error("Fehler beim Abrufen der Tickets:", err);
                this.error = "Fehler beim Laden der Tickets.";
            }
        },
        getCookie(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(";").shift();
        },
        redirectToLogin() {
            window.location.href = "http://tickets.wonder-craft.de/";
        },
    },
};
</script>

<style scoped>
.dashboard-container {
    text-align: center;
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
}

h1 {
    font-size: 2.5rem;
    color: #7289da;
}

h2 {
    color: #5c6bc0;
}

h3 {
    font-size: 1.5rem;
    margin-top: 20px;
}

ul {
    list-style-type: none;
    padding: 0;
}

li {
    margin: 10px 0;
}

a {
    text-decoration: none;
    color: #4a90e2;
}

a:hover {
    text-decoration: underline;
}

button {
    padding: 10px 20px;
    background-color: #7289da;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 5px;
    font-size: 1.1rem;
    margin-top: 20px;
}

button:hover {
    background-color: #5a6eb3;
}

p {
    font-size: 1.1rem;
}
</style>