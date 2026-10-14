import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { employeeService } from '../../services/hr.service';

const failure = (err, fallback) => {
  const e = err.response?.data?.error;
  return { message: e?.message || fallback, code: e?.code, details: e?.details || [], status: err.response?.status };
};

const writeThunk = (type, call, fallback) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try {
      const res = await call(arg);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(failure(err, fallback));
    }
  });

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchEmployees = createAsyncThunk('employees/fetchList', async (params, { rejectWithValue }) => {
  try {
    const res = await employeeService.list(params);
    return { data: res.data.data, meta: res.data.meta };
  } catch (err) {
    return rejectWithValue(failure(err, 'Failed to load employees'));
  }
});

export const fetchEmployee = writeThunk('employees/fetchOne', (id) => employeeService.get(id), 'Employee not found');
export const createEmployee = writeThunk('employees/create', (data) => employeeService.create(data), 'Failed to register employee');
export const updateEmployee = writeThunk('employees/update', ({ id, data }) => employeeService.update(id, data), 'Failed to update employee');
export const assignManager = writeThunk('employees/assignManager', ({ id, reportingManagerId }) => employeeService.assignManager(id, reportingManagerId), 'Failed to assign manager');
export const deactivateEmployee = writeThunk('employees/deactivate', ({ id, reason }) => employeeService.deactivate(id, reason), 'Failed to deactivate employee');
export const confirmEmployee = writeThunk('employees/confirm', (id) => employeeService.confirm(id), 'Failed to confirm probation');
export const reactivateEmployee = writeThunk('employees/reactivate', (id) => employeeService.reactivate(id), 'Failed to reactivate employee');
export const linkEmployeeUser = writeThunk('employees/linkUser', ({ id, userId }) => employeeService.linkUser(id, userId), 'Failed to link the user account');

// ─── Profile sub-resource thunks ─────────────────────────────────────────────

const subThunk = (type, call, fallback) =>
  createAsyncThunk(type, async (id, { rejectWithValue }) => {
    try {
      const res = await call(id);
      return { id, data: res.data.data };
    } catch (err) {
      return rejectWithValue({ id, ...failure(err, fallback) });
    }
  });

export const fetchEmployeeCertifications = subThunk('employees/fetchCertifications', (id) => employeeService.getCertifications(id), 'Failed to load certifications');
export const fetchEmployeeLeaveHistory = subThunk('employees/fetchLeaveHistory', (id) => employeeService.getLeaveHistory(id), 'Failed to load leave history');
export const fetchEmployeeProjects = subThunk('employees/fetchProjects', (id) => employeeService.getProjects(id), 'Failed to load projects');
export const fetchEmployeeDocuments = subThunk('employees/fetchDocuments', (id) => employeeService.getDocuments(id), 'Failed to load documents');
export const fetchEmployeePayroll = subThunk('employees/fetchPayroll', (id) => employeeService.getPayroll(id), 'Failed to load payroll');

// ─── Slice ────────────────────────────────────────────────────────────────────

const SUB_KEYS = ['certifications', 'leaveHistory', 'projects', 'documents', 'payroll'];

const employeesSlice = createSlice({
  name: 'employees',
  initialState: {
    items: [],
    meta: null,
    listLoading: true,
    listError: null,

    profile: null,
    profileLoading: false,
    profileError: null,

    certifications: {},
    leaveHistory: {},
    projects: {},
    documents: {},
    payroll: {},
    subLoading: {},
    subError: {},
  },
  reducers: {
    clearProfile(state) {
      state.profile = null;
      state.profileError = null;
      SUB_KEYS.forEach((k) => { state[k] = {}; });
      state.subError = {};
    },
    clearListError(state) {
      state.listError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => { state.listLoading = true; state.listError = null; })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.listLoading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload || { message: 'Failed to load employees' };
      });

    builder
      .addCase(fetchEmployee.pending, (state) => { state.profileLoading = true; state.profileError = null; })
      .addCase(fetchEmployee.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profile = action.payload;
        const idx = state.items.findIndex((e) => e._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(fetchEmployee.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.payload || { message: 'Employee not found' };
      });

    // Write responses carry bare ids for department and manager; keep the populated names already on screen
    // unless the write changed them (the pages refetch after a write anyway).
    const merge = (current, updated) => {
      const next = { ...current, ...updated };
      ['departmentId', 'reportingManagerId'].forEach((field) => {
        const was = current[field];
        const now = updated[field];
        if (was && typeof was === 'object' && typeof now === 'string' && was._id === now) next[field] = was;
      });
      return next;
    };
    const applyUpdated = (state, action) => {
      const updated = action.payload;
      const idx = state.items.findIndex((e) => e._id === updated._id);
      if (idx !== -1) state.items[idx] = merge(state.items[idx], updated);
      if (state.profile?._id === updated._id) state.profile = merge(state.profile, updated);
    };
    [updateEmployee, assignManager, deactivateEmployee, confirmEmployee, reactivateEmployee, linkEmployeeUser].forEach((thunk) => {
      builder.addCase(thunk.fulfilled, applyUpdated);
    });

    SUB_KEYS.forEach((key) => {
      const thunk = {
        certifications: fetchEmployeeCertifications,
        leaveHistory: fetchEmployeeLeaveHistory,
        projects: fetchEmployeeProjects,
        documents: fetchEmployeeDocuments,
        payroll: fetchEmployeePayroll,
      }[key];
      builder
        .addCase(thunk.pending, (state, action) => { state.subLoading[`${key}:${action.meta.arg}`] = true; delete state.subError[`${key}:${action.meta.arg}`]; })
        .addCase(thunk.fulfilled, (state, action) => {
          state.subLoading[`${key}:${action.payload.id}`] = false;
          state[key][action.payload.id] = action.payload.data;
        })
        .addCase(thunk.rejected, (state, action) => {
          const id = action.meta.arg;
          state.subLoading[`${key}:${id}`] = false;
          state.subError[`${key}:${id}`] = action.payload?.message || 'Failed to load';
        });
    });
  },
});

export const { clearProfile, clearListError } = employeesSlice.actions;

export const selectEmployees       = (s) => s.employees.items;
export const selectEmployeesMeta   = (s) => s.employees.meta;
export const selectEmployeesLoading = (s) => s.employees.listLoading;
export const selectEmployeesError  = (s) => s.employees.listError;
export const selectEmployeeProfile  = (s) => s.employees.profile;
export const selectProfileLoading   = (s) => s.employees.profileLoading;
export const selectProfileError     = (s) => s.employees.profileError;
export const selectEmployeeSub     = (key, id) => (s) => s.employees[key]?.[id];
export const selectSubLoading      = (key, id) => (s) => !!s.employees.subLoading[`${key}:${id}`];
export const selectSubError        = (key, id) => (s) => s.employees.subError[`${key}:${id}`] || '';

export default employeesSlice.reducer;
