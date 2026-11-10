export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

let refreshPromise = null;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

export async function refreshAccessToken() {
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        try {
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
            processQueue(null, data.accessToken);
            return data.accessToken;
        } catch (error) {
            processQueue(error, null);
            localStorage.removeItem("accessToken");
            throw error;
        } finally {
            refreshPromise = null;
        }
    })();

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
        if (refreshPromise) {
            // If a refresh is already happening, queue this request to wait for it
            try {
                token = await new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                });
                response = await makeRequest(token);
            } catch (err) {
                throw err;
            }
        } else {
            try {
                token = await refreshAccessToken();
                response = await makeRequest(token);
            } catch (error) {
                throw error;
            }
        }
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
        if (refreshPromise) {
            try {
                token = await new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                });
                response = await makeRequest(token);
            } catch (err) {
                throw err;
            }
        } else {
            try {
                token = await refreshAccessToken();
                response = await makeRequest(token);
            } catch (error) {
                throw error;
            }
        }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Image upload failed.");
    }

    return data;
}