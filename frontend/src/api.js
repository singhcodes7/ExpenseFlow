export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
let refreshPromise = null;

export async function refreshAccessToken() {
    // Reuse an ongoing refresh request instead of sending duplicates.
    if (!refreshPromise) {
        refreshPromise = (async () => {
            const response = await fetch(`${API_URL}/refresh`, {
                method: "POST",
                credentials: "include",
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                localStorage.removeItem("accessToken");
                throw new Error(
                    data.message || "Your session has expired. Please log in again."
                );
            }

            localStorage.setItem("accessToken", data.accessToken);
            return data.accessToken;
        })().finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
}

export async function apiRequest(endpoint, options = {}) {
    const makeRequest = async (token) => {
        const headers = {
            "Content-Type": "application/json",
            ...options.headers,
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        } else {
            delete headers.Authorization;
        }

        return fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: "include",
        });
    };

    let token = localStorage.getItem("accessToken");
    let response = await makeRequest(token);

    if (response.status === 401 && endpoint !== "/refresh") {
        token = await refreshAccessToken();
        response = await makeRequest(token);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
    }

    return data;
}

export async function apiUpload(endpoint, formData) {
    const makeRequest = async (token) => {
        const headers = {};

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        return fetch(`${API_URL}${endpoint}`, {
            method: "POST",
            headers,
            body: formData,
            credentials: "include",
        });
    };

    let token = localStorage.getItem("accessToken");
    let response = await makeRequest(token);

    if (response.status === 401 && endpoint !== "/refresh") {
        token = await refreshAccessToken();
        response = await makeRequest(token);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Image upload failed.");
    }

    return data;
}
