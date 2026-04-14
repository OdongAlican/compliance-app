/**
 * =============================================================================
 * Axios Service Layer — Production Configuration
 * =============================================================================
 *
 * Features:
 *  - Centralised axios instance (baseURL, timeout, default headers)
 *  - Session-storage token management (accessToken + refreshToken)
 *  - Automatic Bearer token injection on every request
 *  - Transparent token refresh on 401 with request queue (no duplicate refreshes)
 *  - Automatic retry of all queued requests after a successful refresh
 *  - Force-logout on refresh failure (expired session)
 *  - Public-route bypass list (login, register, etc.)
 *  - Idempotency-key injection for mutating requests (POST/PUT/PATCH)
 *  - Request deduplication via AbortController
 *  - Standardised error shape returned to callers
 *  - Convenience named methods: api.get / post / put / patch / delete
 *  - Environment-aware base URL and timeout via .env
 * =============================================================================
 */

import axios from "axios";

// ---------------------------------------------------------------------------
// 1. ENVIRONMENT
// ---------------------------------------------------------------------------
const BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:3000/api";
const TIMEOUT = Number(process.env.REACT_APP_API_TIMEOUT) || 30_000; // 30 s
const REFRESH_ENDPOINT =
    process.env.REACT_APP_REFRESH_ENDPOINT || "/auth/token/refresh/";

// ---------------------------------------------------------------------------
// 2. SESSION-STORAGE TOKEN HELPERS
// ---------------------------------------------------------------------------

/**
 * Keys used in sessionStorage.
 * sessionStorage is automatically cleared when the browser tab closes,
 * giving better security than localStorage for auth tokens.
 */
const KEYS = {
    ACCESS_TOKEN: "access_token",
    REFRESH_TOKEN: "refresh_token",
    USER: "user",
    EXPIRES_AT: "token_expires_at", // optional: store expiry if API returns it
};

export const TokenService = {
    // ---- Access Token ----
    getAccessToken: () => sessionStorage.getItem(KEYS.ACCESS_TOKEN),
    setAccessToken: (token) => sessionStorage.setItem(KEYS.ACCESS_TOKEN, token),
    removeAccessToken: () => sessionStorage.removeItem(KEYS.ACCESS_TOKEN),

    // ---- Refresh Token ----
    getRefreshToken: () => sessionStorage.getItem(KEYS.REFRESH_TOKEN),
    setRefreshToken: (token) => sessionStorage.setItem(KEYS.REFRESH_TOKEN, token),
    removeRefreshToken: () => sessionStorage.removeItem(KEYS.REFRESH_TOKEN),

    // ---- User info ----
    getUser: () => {
        try {
            return JSON.parse(sessionStorage.getItem(KEYS.USER));
        } catch {
            return null;
        }
    },
    setUser: (user) =>
        sessionStorage.setItem(KEYS.USER, JSON.stringify(user)),
    removeUser: () => sessionStorage.removeItem(KEYS.USER),

    // ---- Token expiry (optional) ----
    setExpiresAt: (isoString) =>
        sessionStorage.setItem(KEYS.EXPIRES_AT, isoString),
    getExpiresAt: () => sessionStorage.getItem(KEYS.EXPIRES_AT),
    isAccessTokenExpired: () => {
        const expiresAt = sessionStorage.getItem(KEYS.EXPIRES_AT);
        if (!expiresAt) return false; // unknown — let the server tell us
        return new Date() >= new Date(expiresAt);
    },

    /**
     * Persist full auth response from the server.
     * API shape: { token, user }  (JWT is stateless — no refresh token)
     */
    saveAuthResponse: ({ token, user, access, refresh, expires_at }) => {
        // support both { token } (Rails API) and { access, refresh } (DRF style)
        const accessToken = token || access;
        if (accessToken) TokenService.setAccessToken(accessToken);
        if (refresh) TokenService.setRefreshToken(refresh);
        if (user) TokenService.setUser(user);
        if (expires_at) TokenService.setExpiresAt(expires_at);
    },

    /**
     * Clear all auth data — used on logout or forced sign-out.
     */
    clearAll: () => {
        sessionStorage.removeItem(KEYS.ACCESS_TOKEN);
        sessionStorage.removeItem(KEYS.REFRESH_TOKEN);
        sessionStorage.removeItem(KEYS.USER);
        sessionStorage.removeItem(KEYS.EXPIRES_AT);
    },
};

// ---------------------------------------------------------------------------
// 3. LOGOUT HELPER
// ---------------------------------------------------------------------------

/**
 * Clears tokens and redirects to the login page.
 * Replace the redirect path to match your routing setup.
 */
export const forceLogout = (reason = "Session expired. Please sign in again.") => {
    TokenService.clearAll();
    // Store a user-facing message that the login page can display.
    sessionStorage.setItem("logout_reason", reason);
    window.location.replace("/login");
};

/**
 * forceForbidden
 *
 * Dispatches a custom DOM event so the React app can handle a 403 gracefully
 * (navigate to access-denied) without coupling the axios layer to React Router.
 * The App component listens for this event and calls navigate('/access-denied').
 */
export const forceForbidden = () => {
    window.dispatchEvent(new CustomEvent("app:forbidden"));
};

// ---------------------------------------------------------------------------
// 4. PUBLIC ROUTES — skips token injection on these paths
// ---------------------------------------------------------------------------

const PUBLIC_ROUTES = [
    "/auth/login/",
    "/auth/register/",
    "/auth/forgot-password/",
    "/auth/reset-password/",
    REFRESH_ENDPOINT,
];

const isPublicRoute = (url = "") =>
    PUBLIC_ROUTES.some((route) => url.includes(route));

// ---------------------------------------------------------------------------
// 5. AXIOS INSTANCE
// ---------------------------------------------------------------------------

const instance = axios.create({
    baseURL: BASE_URL,
    timeout: TIMEOUT,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Helps backend identify the client type
        "X-Client": "compliance-web", // Optional: include app version for debugging
        "X-Client-Version": process.env.REACT_APP_VERSION || "1.0.0",
    },
    // Send cookies with cross-origin requests (required if using
    // HttpOnly cookie-based refresh tokens alongside header-based access tokens)
    // withCredentials: true, // CSRF protection if refresh token is in HttpOnly cookie
});

// ---------------------------------------------------------------------------
// 6. TOKEN-REFRESH MUTEX
// ---------------------------------------------------------------------------
// Prevents multiple simultaneous refresh calls.
// All requests that fail with 401 while a refresh is in-flight are queued and
// replayed once the new access token is obtained.

let isRefreshing = false;
let failedQueue = []; // [{ resolve, reject }]

const processQueue = (error, newToken = null) => {
    failedQueue.forEach(({ resolve, reject }) =>
        error ? reject(error) : resolve(newToken)
    );
    failedQueue = [];
};

// ---------------------------------------------------------------------------
// 7. REQUEST INTERCEPTOR
// ---------------------------------------------------------------------------

instance.interceptors.request.use(
    (config) => {
        // Skip token injection for public endpoints
        if (isPublicRoute(config.url)) return config;

        // Proactive expiry check (optional, requires expires_at to be stored)
        // The response interceptor handles the 401 case reactively regardless.

        const token = TokenService.getAccessToken();
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }

        // Inject an idempotency key for mutating requests to prevent duplicate
        // processing if the client retries a failed request.
        const mutating = ["post", "put", "patch"].includes(
            (config.method || "").toLowerCase()
        );
        if (mutating && !config.headers["Idempotency-Key"]) {
            config.headers["Idempotency-Key"] = generateIdempotencyKey();
        }

        return config;
    },
    (error) => Promise.reject(normalizeError(error))
);

// ---------------------------------------------------------------------------
// 8. RESPONSE INTERCEPTOR — refresh logic
// ---------------------------------------------------------------------------

instance.interceptors.response.use(
    // 2xx — pass through directly
    (response) => response,

    // Error — handle 401 with refresh, surface everything else
    async (error) => {
        const originalRequest = error.config;

        // ---- Network / timeout error (no response from server) ----
        if (!error.response) {
            return Promise.reject(
                normalizeError(error, {
                    type: "NETWORK_ERROR",
                    message: "Network error — please check your connection.",
                })
            );
        }

        const { status } = error.response;

        // ---- 401 Unauthorized ----
        if (status === 401 && !originalRequest._retry) {
            // Avoid retrying the refresh endpoint itself
            if (isPublicRoute(originalRequest.url)) {
                return Promise.reject(normalizeError(error));
            }

            // If a refresh is already in-flight, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((newToken) => {
                        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                        return instance(originalRequest);
                    })
                    .catch((queueError) => Promise.reject(normalizeError(queueError)));
            }

            // Mark this request as retried and start a refresh cycle
            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = TokenService.getRefreshToken();

            if (!refreshToken) {
                isRefreshing = false;
                processQueue(new Error("No refresh token available"), null);
                forceLogout("Your session has ended. Please sign in again.");
                return Promise.reject(
                    normalizeError(error, {
                        type: "SESSION_EXPIRED",
                        message: "Session expired. Please sign in again.",
                    })
                );
            }

            try {
                // Use a raw axios call so the interceptor does not intercept this
                const { data } = await axios.post(
                    `${BASE_URL}${REFRESH_ENDPOINT}`,
                    { refresh: refreshToken },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "X-Client": "compliance-web",
                        },
                        withCredentials: true,
                    }
                );

                const newAccessToken = data.access || data.accessToken || data.token;
                const newRefreshToken = data.refresh || data.refreshToken;

                // Persist new tokens
                TokenService.setAccessToken(newAccessToken);
                if (newRefreshToken) TokenService.setRefreshToken(newRefreshToken);
                if (data.expires_at) TokenService.setExpiresAt(data.expires_at);

                // Update the default header for future requests
                instance.defaults.headers.common["Authorization"] =
                    `Bearer ${newAccessToken}`;

                // Flush the queue
                processQueue(null, newAccessToken);

                // Retry the original request
                originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
                return instance(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                TokenService.clearAll();
                forceLogout("Your session has expired. Please sign in again.");
                return Promise.reject(
                    normalizeError(refreshError, {
                        type: "SESSION_EXPIRED",
                        message: "Session expired. Please sign in again.",
                    })
                );
            } finally {
                isRefreshing = false;
            }
        }

        // ---- 403 Forbidden ----
        if (status === 403) {
            forceForbidden();
            return Promise.reject(
                normalizeError(error, {
                    type: "FORBIDDEN",
                    message: "You do not have permission to perform this action.",
                })
            );
        }

        // ---- 404 Not Found ----
        if (status === 404) {
            return Promise.reject(
                normalizeError(error, {
                    type: "NOT_FOUND",
                    message: "The requested resource was not found.",
                })
            );
        }

        // ---- 422 Validation Error ----
        if (status === 422) {
            return Promise.reject(
                normalizeError(error, {
                    type: "VALIDATION_ERROR",
                    message: "Validation failed. Please check your input.",
                })
            );
        }

        // ---- 429 Rate Limited ----
        if (status === 429) {
            return Promise.reject(
                normalizeError(error, {
                    type: "RATE_LIMITED",
                    message: "Too many requests. Please wait a moment and try again.",
                })
            );
        }

        // ---- 5xx Server Error ----
        if (status >= 500) {
            return Promise.reject(
                normalizeError(error, {
                    type: "SERVER_ERROR",
                    message: "A server error occurred. Please try again later.",
                })
            );
        }

        // ---- All other errors ----
        return Promise.reject(normalizeError(error));
    }
);

// ---------------------------------------------------------------------------
// 9. ERROR NORMALISATION
// ---------------------------------------------------------------------------

/**
 * Returns a consistent error object regardless of where the error came from.
 *
 * Callers can rely on:
 *   err.type     — machine-readable error category
 *   err.message  — human-readable message
 *   err.status   — HTTP status code (if available)
 *   err.data     — raw response body (if available)
 *   err.original — the original Error object
 */
function normalizeError(error, overrides = {}) {
    const response = error?.response;

    // Try to extract a server-provided message
    const serverMessage =
        response?.data?.detail ||
        response?.data?.message ||
        response?.data?.error ||
        (Array.isArray(response?.data?.errors)
            ? response.data.errors.map((e) => e.message || e).join(", ")
            : null);

    const normalized = {
        type: overrides.type || "API_ERROR",
        message:
            overrides.message ||
            serverMessage ||
            error?.message ||
            "An unexpected error occurred.",
        status: response?.status || null,
        data: response?.data || null,
        original: error,
    };

    return normalized;
}

// ---------------------------------------------------------------------------
// 10. IDEMPOTENCY KEY GENERATOR
// ---------------------------------------------------------------------------

function generateIdempotencyKey() {
    // Produces a UUID-v4-like string without external dependencies.
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
}

// ---------------------------------------------------------------------------
// 11. ABORT CONTROLLER REGISTRY
// ---------------------------------------------------------------------------
// Allows callers to cancel in-flight requests when a component unmounts.

const pendingRequests = new Map();

/**
 * Returns an AbortController signal and a cleanup function.
 *
 * Usage (inside a React component):
 *   const { signal, abort } = createAbortable("fetch-users");
 *   useEffect(() => () => abort(), []);
 *   api.get("/users/", { signal });
 */
export const createAbortable = (key) => {
    // Cancel any previous request with the same key
    if (pendingRequests.has(key)) {
        pendingRequests.get(key).abort();
    }
    const controller = new AbortController();
    pendingRequests.set(key, controller);

    return {
        signal: controller.signal,
        abort: () => {
            controller.abort();
            pendingRequests.delete(key);
        },
    };
};

// ---------------------------------------------------------------------------
// 12. CONVENIENCE API METHODS
// ---------------------------------------------------------------------------

/**
 * All methods return the response `data` directly so callers don't have
 * to unwrap `response.data` every time.
 *
 * Usage:
 *   import api from "../../services";
 *   const users = await api.get("/users/");
 *   const created = await api.post("/users/", { name: "Alice" });
 */
const api = {
    /**
     * GET — fetch a resource.
     * @param {string} url
     * @param {import("axios").AxiosRequestConfig} [config]
     */
    get: (url, config = {}) =>
        instance.get(url, config).then((r) => r.data),

    /**
     * POST — create a resource.
     * @param {string} url
     * @param {*} data
     * @param {import("axios").AxiosRequestConfig} [config]
     */
    post: (url, data = {}, config = {}) =>
        instance.post(url, data, config).then((r) => r.data),

    /**
     * PUT — full update of a resource.
     * @param {string} url
     * @param {*} data
     * @param {import("axios").AxiosRequestConfig} [config]
     */
    put: (url, data = {}, config = {}) =>
        instance.put(url, data, config).then((r) => r.data),

    /**
     * PATCH — partial update of a resource.
     * @param {string} url
     * @param {*} data
     * @param {import("axios").AxiosRequestConfig} [config]
     */
    patch: (url, data = {}, config = {}) =>
        instance.patch(url, data, config).then((r) => r.data),

    /**
     * DELETE — remove a resource.
     * @param {string} url
     * @param {import("axios").AxiosRequestConfig} [config]
     */
    delete: (url, config = {}) =>
        instance.delete(url, config).then((r) => r.data),

    /**
     * Raw instance — use when you need full control over the response
     * (e.g. checking headers, status, streaming, file downloads).
     *
     * Usage:
     *   const response = await api.raw.get("/report/download", { responseType: "blob" });
     */
    raw: instance,
};

export default api;

/**
 * =============================================================================
 * USAGE EXAMPLES
 * =============================================================================
 *
 * ── Basic fetch ──
 *   import api from "../../services";
 *   const data = await api.get("/inspections/");
 *
 * ── POST with body ──
 *   const newRecord = await api.post("/inspections/", { location: "Lab A" });
 *
 * ── PATCH ──
 *   await api.patch(`/inspections/${id}/`, { status: "Completed" });
 *
 * ── DELETE ──
 *   await api.delete(`/inspections/${id}/`);
 *
 * ── File upload (multipart) ──
 *   const form = new FormData();
 *   form.append("file", file);
 *   await api.post("/documents/upload/", form, {
 *     headers: { "Content-Type": "multipart/form-data" },
 *   });
 *
 * ── File download (blob) ──
 *   const response = await api.raw.get("/reports/canteen.pdf", {
 *     responseType: "blob",
 *   });
 *
 * ── Cancellable request (safe for React useEffect) ──
 *   const { signal, abort } = createAbortable("canteen-list");
 *   useEffect(() => () => abort(), []);
 *   const data = await api.get("/inspections/", { signal });
 *
 * ── Save tokens after login ──
 *   import { TokenService } from "../../services";
 *   const data = await api.post("/auth/login/", { email, password });
 *   TokenService.saveAuthResponse(data); // { access, refresh, user, expires_at }
 *
 * ── Logout ──
 *   import { forceLogout } from "../../services";
 *   forceLogout("You signed out.");
 *
 * ── Custom timeout for a single call ──
 *   const data = await api.get("/slow-endpoint/", { timeout: 60_000 });
 *
 * ── Accessing tokens directly ──
 *   const token = TokenService.getAccessToken();
 *   const user  = TokenService.getUser();
 *
 * =============================================================================
 * REQUIRED .env VARIABLES
 * =============================================================================
 *
 *   REACT_APP_API_BASE_URL=https://api.yourcompany.com/api
 *   REACT_APP_API_TIMEOUT=30000
 *   REACT_APP_REFRESH_ENDPOINT=/auth/token/refresh/
 *   REACT_APP_VERSION=1.0.0
 *
 * =============================================================================
 */
