import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ScienceLabSetupService } from '../../services/scienceLab.service';

export const fetchScienceLabSetups = createAsyncThunk(
  'scienceLab/fetchSetups',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { filters } = getState().scienceLab;
      const query = {
        page: filters.page, per_page: filters.per_page,
        ...(filters.laboratory_name   ? { 'filter[laboratory_name]': filters.laboratory_name }     : {}),
        ...(filters.date_from         ? { 'filter[date_from]': filters.date_from }                 : {}),
        ...(filters.date_to           ? { 'filter[date_to]': filters.date_to }                     : {}),
        ...(filters.safety_officer_id ? { 'filter[safety_officer_id]': filters.safety_officer_id } : {}),
        ...(filters.supervisor_id     ? { 'filter[supervisor_id]': filters.supervisor_id }         : {}),
        ...params,
      };
      const res  = await ScienceLabSetupService.list(query);
      const data = Array.isArray(res) ? res : (res.data ?? []);
      const meta = res.meta ?? null;
      return { data, meta };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.errors?.[0] || err?.response?.data?.error || 'Failed to load science lab inspections.');
    }
  }
);

export const createScienceLabSetup = createAsyncThunk('scienceLab/createSetup', async (data, { rejectWithValue }) => {
  try { const res = await ScienceLabSetupService.create(data); return res.data ?? res; }
  catch (err) { return rejectWithValue(err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to create.'); }
});

export const updateScienceLabSetup = createAsyncThunk('scienceLab/updateSetup', async ({ id, data }, { rejectWithValue }) => {
  try { const res = await ScienceLabSetupService.update(id, data); return res.data ?? res; }
  catch (err) { return rejectWithValue(err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update.'); }
});

export const deleteScienceLabSetup = createAsyncThunk('scienceLab/deleteSetup', async (id, { rejectWithValue }) => {
  try { await ScienceLabSetupService.remove(id); return id; }
  catch (err) { return rejectWithValue(err?.response?.data?.error || 'Failed to delete.'); }
});

export const reassignScienceLabSupervisor = createAsyncThunk('scienceLab/reassignSupervisor', async ({ id, supervisorId }, { rejectWithValue }) => {
  try { const res = await ScienceLabSetupService.reassignSupervisor(id, supervisorId); return res.data ?? res; }
  catch (err) { return rejectWithValue(err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to reassign supervisor.'); }
});

export const reassignScienceLabSafetyOfficer = createAsyncThunk('scienceLab/reassignSafetyOfficer', async ({ id, safetyOfficerId }, { rejectWithValue }) => {
  try { const res = await ScienceLabSetupService.reassignSafetyOfficer(id, safetyOfficerId); return res.data ?? res; }
  catch (err) { return rejectWithValue(err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to reassign safety officer.'); }
});

const INITIAL_FILTERS = { page: 1, per_page: 10, laboratory_name: '', date_from: '', date_to: '', safety_officer_id: '', supervisor_id: '' };

const scienceLabSlice = createSlice({
  name: 'scienceLab',
  initialState: { setups: [], setupsMeta: null, setupsLoading: false, setupsError: null, actionLoading: false, actionError: null, filters: INITIAL_FILTERS },
  reducers: {
    setScienceLabPage:      (s, a) => { s.filters.page = a.payload; },
    setScienceLabLabName:   (s, a) => { s.filters.laboratory_name = a.payload; s.filters.page = 1; },
    setScienceLabDateFrom:  (s, a) => { s.filters.date_from = a.payload; s.filters.page = 1; },
    setScienceLabDateTo:    (s, a) => { s.filters.date_to = a.payload; s.filters.page = 1; },
    setScienceLabSOFilter:  (s, a) => { s.filters.safety_officer_id = a.payload; s.filters.page = 1; },
    setScienceLabSupFilter: (s, a) => { s.filters.supervisor_id = a.payload; s.filters.page = 1; },
    clearScienceLabFilters: (s)    => { s.filters = INITIAL_FILTERS; },
    clearScienceLabError:   (s)    => { s.setupsError = null; },
    clearScienceLabActionError: (s) => { s.actionError = null; },
  },
  extraReducers: (builder) => {
    const pending   = (key) => (s) => { s[key] = true; };
    const rejected  = (key, errKey) => (s, a) => { s[key] = false; s[errKey] = a.payload; };

    builder
      .addCase(fetchScienceLabSetups.pending,   pending('setupsLoading'))
      .addCase(fetchScienceLabSetups.fulfilled, (s, a) => { s.setupsLoading = false; s.setups = a.payload.data; s.setupsMeta = a.payload.meta; })
      .addCase(fetchScienceLabSetups.rejected,  rejected('setupsLoading', 'setupsError'))

      .addCase(createScienceLabSetup.pending,   pending('actionLoading'))
      .addCase(createScienceLabSetup.fulfilled, (s, a) => { s.actionLoading = false; s.setups.unshift(a.payload); if (s.setupsMeta) s.setupsMeta.total += 1; })
      .addCase(createScienceLabSetup.rejected,  rejected('actionLoading', 'actionError'))

      .addCase(updateScienceLabSetup.pending,   pending('actionLoading'))
      .addCase(updateScienceLabSetup.fulfilled, (s, a) => { s.actionLoading = false; const i = s.setups.findIndex(x => x.id === a.payload.id); if (i !== -1) s.setups[i] = a.payload; })
      .addCase(updateScienceLabSetup.rejected,  rejected('actionLoading', 'actionError'))

      .addCase(deleteScienceLabSetup.pending,   pending('actionLoading'))
      .addCase(deleteScienceLabSetup.fulfilled, (s, a) => { s.actionLoading = false; s.setups = s.setups.filter(x => x.id !== a.payload); if (s.setupsMeta) s.setupsMeta.total = Math.max(0, s.setupsMeta.total - 1); })
      .addCase(deleteScienceLabSetup.rejected,  rejected('actionLoading', 'actionError'))

      .addCase(reassignScienceLabSupervisor.pending,     pending('actionLoading'))
      .addCase(reassignScienceLabSupervisor.fulfilled,   (s, a) => { s.actionLoading = false; const i = s.setups.findIndex(x => x.id === a.payload?.id); if (i !== -1) s.setups[i] = a.payload; })
      .addCase(reassignScienceLabSupervisor.rejected,    rejected('actionLoading', 'actionError'))
      .addCase(reassignScienceLabSafetyOfficer.pending,  pending('actionLoading'))
      .addCase(reassignScienceLabSafetyOfficer.fulfilled,(s, a) => { s.actionLoading = false; const i = s.setups.findIndex(x => x.id === a.payload?.id); if (i !== -1) s.setups[i] = a.payload; })
      .addCase(reassignScienceLabSafetyOfficer.rejected, rejected('actionLoading', 'actionError'));
  },
});

export const {
  setScienceLabPage, setScienceLabLabName, setScienceLabDateFrom, setScienceLabDateTo,
  setScienceLabSOFilter, setScienceLabSupFilter, clearScienceLabFilters, clearScienceLabError, clearScienceLabActionError,
} = scienceLabSlice.actions;

export const selectScienceLabSetups        = (s) => s.scienceLab.setups;
export const selectScienceLabMeta          = (s) => s.scienceLab.setupsMeta;
export const selectScienceLabLoading       = (s) => s.scienceLab.setupsLoading;
export const selectScienceLabError         = (s) => s.scienceLab.setupsError;
export const selectScienceLabActionLoading = (s) => s.scienceLab.actionLoading;
export const selectScienceLabActionError   = (s) => s.scienceLab.actionError;
export const selectScienceLabFilters       = (s) => s.scienceLab.filters;

export default scienceLabSlice.reducer;
