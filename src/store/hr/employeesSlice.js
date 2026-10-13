import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { employeeService } from '../../services/hr.service';

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchEmployees = createAsyncThunk(
  'employees/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      const res = await employeeService.list(params);
      return { data: res.data.data, meta: res.data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to load employees' });
    }
  }
);

export const fetchEmployee = createAsyncThunk(
  'employees/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const res = await employeeService.get(id);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Employee not found' });
    }
  }
);

export const createEmployee = createAsyncThunk(
  'employees/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await employeeService.create(data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to register employee' });
    }
  }
);

export const updateEmployee = createAsyncThunk(
  'employees/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await employeeService.update(id, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to update employee' });
    }
  }
);

export const assignManager = createAsyncThunk(
  'employees/assignManager',
  async ({ id, reportingManagerId }, { rejectWithValue }) => {
    try {
      const res = await employeeService.assignManager(id, reportingManagerId);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to assign manager' });
    }
  }
);

export const deactivateEmployee = createAsyncThunk(
  'employees/deactivate',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const res = await employeeService.deactivate(id, reason);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to deactivate employee' });
    }
  }
);

// ─── Profile sub-resource thunks ─────────────────────────────────────────────

export const fetchEmployeeCertifications = createAsyncThunk(
  'employees/fetchCertifications',
  async (id, { rejectWithValue }) => {
    try {
      const res = await employeeService.getCertifications(id);
      return { id, data: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to load certifications' });
    }
  }
);

export const fetchEmployeeLeaveHistory = createAsyncThunk(
  'employees/fetchLeaveHistory',
  async (id, { rejectWithValue }) => {
    try {
      const res = await employeeService.getLeaveHistory(id);
      return { id, data: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to load leave history' });
    }
  }
);

export const fetchEmployeeProjects = createAsyncThunk(
  'employees/fetchProjects',
  async (id, { rejectWithValue }) => {
    try {
      const res = await employeeService.getProjects(id);
      return { id, data: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to load projects' });
    }
  }
);

export const fetchEmployeeDocuments = createAsyncThunk(
  'employees/fetchDocuments',
  async (id, { rejectWithValue }) => {
    try {
      const res = await employeeService.getDocuments(id);
      return { id, data: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to load documents' });
    }
  }
);

export const fetchEmployeePayroll = createAsyncThunk(
  'employees/fetchPayroll',
  async (id, { rejectWithValue }) => {
    try {
      const res = await employeeService.getPayroll(id);
      return { id, data: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to load payroll' });
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const employeesSlice = createSlice({
  name: 'employees',
  initialState: {
    // List
    items: [],
    meta: null,
    listLoading: false,
    listError: null,

    // Profile
    profile: null,
    profileLoading: false,
    profileError: null,

    // Sub-resources (keyed by employee id for caching)
    certifications: {},
    leaveHistory: {},
    projects: {},
    documents: {},
    payroll: {},
    subLoading: {},
  },
  reducers: {
    clearProfile(state) {
      state.profile = null;
      state.profileError = null;
    },
    clearListError(state) {
      state.listError = null;
    },
  },
  extraReducers: (builder) => {
    // ── List ──────────────────────────────────────────────────────────────
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.listLoading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload;
      });

    // ── Single ─────────────────────────────────────────────────────────────
    builder
      .addCase(fetchEmployee.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(fetchEmployee.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profile = action.payload;
        // Also update the item in the list if it exists
        const idx = state.items.findIndex((e) => e._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(fetchEmployee.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.payload;
      });

    // ── Create ─────────────────────────────────────────────────────────────
    builder.addCase(createEmployee.fulfilled, (state, action) => {
      state.items.unshift(action.payload);
      if (state.meta) state.meta.total += 1;
    });

    // ── Update ────────────────────────────────────────────────────────────
    builder.addCase(updateEmployee.fulfilled, (state, action) => {
      const updated = action.payload;
      const idx = state.items.findIndex((e) => e._id === updated._id);
      if (idx !== -1) state.items[idx] = updated;
      if (state.profile?._id === updated._id) state.profile = updated;
    });

    // ── Assign manager ────────────────────────────────────────────────────
    builder.addCase(assignManager.fulfilled, (state, action) => {
      const updated = action.payload;
      const idx = state.items.findIndex((e) => e._id === updated._id);
      if (idx !== -1) state.items[idx] = updated;
      if (state.profile?._id === updated._id) state.profile = updated;
    });

    // ── Deactivate ─────────────────────────────────────────────────────────
    builder.addCase(deactivateEmployee.fulfilled, (state, action) => {
      const updated = action.payload;
      const idx = state.items.findIndex((e) => e._id === updated._id);
      if (idx !== -1) state.items[idx] = updated;
      if (state.profile?._id === updated._id) state.profile = updated;
    });

    // ── Sub-resources ──────────────────────────────────────────────────────
    const subPending = (key) => (state, action) => {
      state.subLoading[key] = true;
    };
    const subDone = (key) => (state, action) => {
      state.subLoading[key] = false;
      state[key][action.payload.id] = action.payload.data;
    };
    const subFail = (key) => (state) => {
      state.subLoading[key] = false;
    };

    builder
      .addCase(fetchEmployeeCertifications.pending,  subPending('certifications'))
      .addCase(fetchEmployeeCertifications.fulfilled, subDone('certifications'))
      .addCase(fetchEmployeeCertifications.rejected,  subFail('certifications'))

      .addCase(fetchEmployeeLeaveHistory.pending,  subPending('leaveHistory'))
      .addCase(fetchEmployeeLeaveHistory.fulfilled, subDone('leaveHistory'))
      .addCase(fetchEmployeeLeaveHistory.rejected,  subFail('leaveHistory'))

      .addCase(fetchEmployeeProjects.pending,  subPending('projects'))
      .addCase(fetchEmployeeProjects.fulfilled, subDone('projects'))
      .addCase(fetchEmployeeProjects.rejected,  subFail('projects'))

      .addCase(fetchEmployeeDocuments.pending,  subPending('documents'))
      .addCase(fetchEmployeeDocuments.fulfilled, subDone('documents'))
      .addCase(fetchEmployeeDocuments.rejected,  subFail('documents'))

      .addCase(fetchEmployeePayroll.pending,  subPending('payroll'))
      .addCase(fetchEmployeePayroll.fulfilled, subDone('payroll'))
      .addCase(fetchEmployeePayroll.rejected,  subFail('payroll'));
  },
});

export const { clearProfile, clearListError } = employeesSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectEmployees       = (s) => s.employees.items;
export const selectEmployeesMeta   = (s) => s.employees.meta;
export const selectEmployeesLoading = (s) => s.employees.listLoading;
export const selectEmployeesError  = (s) => s.employees.listError;
export const selectEmployeeProfile  = (s) => s.employees.profile;
export const selectProfileLoading   = (s) => s.employees.profileLoading;
export const selectProfileError     = (s) => s.employees.profileError;
export const selectEmployeeSub     = (key, id) => (s) => s.employees[key]?.[id];
export const selectSubLoading      = (key) => (s) => !!s.employees.subLoading[key];

export default employeesSlice.reducer;
