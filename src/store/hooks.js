/**
 * src/store/hooks.js
 *
 * Pre-typed versions of useDispatch / useSelector for this store.
 * Import these instead of the raw react-redux versions throughout the app.
 *
 * Usage:
 *   import { useAppDispatch, useAppSelector } from '../store/hooks';
 *   const dispatch = useAppDispatch();
 *   const user = useAppSelector(selectUser);
 */
import { useDispatch, useSelector } from 'react-redux';

/** @returns {import('@reduxjs/toolkit').ThunkDispatch} */
export const useAppDispatch = () => useDispatch();

/** @param {(state: any) => any} selector */
export const useAppSelector = (selector) => useSelector(selector);
