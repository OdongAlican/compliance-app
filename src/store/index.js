/**
 * src/store/index.js
 *
 * Redux Toolkit store — single source of truth.
 *
 * Slices registered here:
 *   auth   → authSlice   (login, logout, hydration)
 *   users  → usersSlice  (user list, filters, pagination)
 *   roles  → rolesSlice  (roles list, permissions matrix)
 */
import { configureStore } from '@reduxjs/toolkit';
import authReducer  from './slices/authSlice';
import usersReducer from './slices/usersSlice';
import rolesReducer from './slices/rolesSlice';

const store = configureStore({
  reducer: {
    auth:  authReducer,
    users: usersReducer,
    roles: rolesReducer,
  },
  // Redux Toolkit adds redux-thunk and (in development) the Immer proxy by default.
  // The devTools flag is automatically false in production builds.
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
