import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userService, roleService, departmentService } from '../../services/platform.service';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await userService.list(params);
      return { users: data.data, meta: data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load users');
    }
  }
);

export const inviteUser = createAsyncThunk(
  'users/inviteUser',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await userService.invite(payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to invite user');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const { data } = await userService.update(id, payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to update user');
    }
  }
);

export const setUserStatus = createAsyncThunk(
  'users/setUserStatus',
  async ({ id, status, reason }, { rejectWithValue }) => {
    try {
      const { data } = await userService.setStatus(id, status, reason);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to update status');
    }
  }
);

export const setUserRoles = createAsyncThunk(
  'users/setUserRoles',
  async ({ id, roleIds }, { rejectWithValue }) => {
    try {
      const { data } = await userService.setRoles(id, roleIds);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to update roles');
    }
  }
);

export const sendPasswordReset = createAsyncThunk(
  'users/sendPasswordReset',
  async (id, { rejectWithValue }) => {
    try {
      await userService.sendPasswordReset(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to send reset link');
    }
  }
);

export const resendUserInvite = createAsyncThunk(
  'users/resendInvite',
  async (id, { rejectWithValue }) => {
    try {
      await userService.resendInvite(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to resend invite');
    }
  }
);

export const cancelUserInvite = createAsyncThunk(
  'users/cancelInvite',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      await userService.cancelInvite(id, reason);
      return id; // hard-deleted on server, remove from local list
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to cancel invite');
    }
  }
);

// ─── Roles Thunks ─────────────────────────────────────────────────────────────

export const fetchRoles = createAsyncThunk(
  'users/fetchRoles',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await roleService.list();
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load roles');
    }
  }
);

export const createRole = createAsyncThunk(
  'users/createRole',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await roleService.create(payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to create role');
    }
  }
);

export const updateRole = createAsyncThunk(
  'users/updateRole',
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const { data } = await roleService.update(id, payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to update role');
    }
  }
);

export const deleteRole = createAsyncThunk(
  'users/deleteRole',
  async (id, { rejectWithValue }) => {
    try {
      await roleService.delete(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to delete role');
    }
  }
);

export const fetchPermissions = createAsyncThunk(
  'users/fetchPermissions',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await roleService.getPermissions();
      return data.data; // { catalogue, keys, uiModules, uiActions }
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load permissions');
    }
  }
);

export const fetchDepartments = createAsyncThunk(
  'users/fetchDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await departmentService.list();
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load departments');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    // Users list
    users: [],
    meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
    usersLoading: false,
    usersError: null,

    // Roles list (full, not paginated)
    roles: [],
    rolesLoading: false,
    rolesError: null,

    // Permission catalogue
    permissionCatalogue: null, // { catalogue, keys, uiModules, uiActions }
    permissionsLoading: false,

    // Departments (for invite form picker)
    departments: [],
    departmentsLoading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    // ── fetchUsers ──
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload.users;
        state.meta = action.payload.meta;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.payload;
      });

    // ── inviteUser ──
    builder.addCase(inviteUser.fulfilled, (state, action) => {
      state.users.unshift(action.payload);
      state.meta.total += 1;
    });

    // ── updateUser ──
    builder.addCase(updateUser.fulfilled, (state, action) => {
      const idx = state.users.findIndex((u) => u._id === action.payload._id);
      if (idx !== -1) state.users[idx] = action.payload;
    });

    // ── setUserStatus ──
    builder.addCase(setUserStatus.fulfilled, (state, action) => {
      const idx = state.users.findIndex((u) => u._id === action.payload._id);
      if (idx !== -1) state.users[idx] = action.payload;
    });

    // ── setUserRoles ──
    builder.addCase(setUserRoles.fulfilled, (state, action) => {
      const idx = state.users.findIndex((u) => u._id === action.payload._id);
      if (idx !== -1) state.users[idx] = action.payload;
    });

    // ── cancelUserInvite — hard delete, remove from list ──
    builder.addCase(cancelUserInvite.fulfilled, (state, action) => {
      state.users = state.users.filter((u) => u._id !== action.payload);
      state.meta.total = Math.max(0, state.meta.total - 1);
    });

    // ── fetchRoles ──
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.rolesLoading = true;
        state.rolesError = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.rolesLoading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.rolesLoading = false;
        state.rolesError = action.payload;
      });

    // ── createRole ──
    builder.addCase(createRole.fulfilled, (state, action) => {
      state.roles.push(action.payload);
    });

    // ── updateRole ──
    builder.addCase(updateRole.fulfilled, (state, action) => {
      const idx = state.roles.findIndex((r) => r._id === action.payload._id);
      if (idx !== -1) state.roles[idx] = action.payload;
    });

    // ── deleteRole ──
    builder.addCase(deleteRole.fulfilled, (state, action) => {
      state.roles = state.roles.filter((r) => r._id !== action.payload);
    });

    // ── fetchPermissions ──
    builder
      .addCase(fetchPermissions.pending, (state) => { state.permissionsLoading = true; })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.permissionsLoading = false;
        state.permissionCatalogue = action.payload;
      })
      .addCase(fetchPermissions.rejected, (state) => { state.permissionsLoading = false; });

    // ── fetchDepartments ──
    builder
      .addCase(fetchDepartments.pending, (state) => { state.departmentsLoading = true; })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.departmentsLoading = false;
        state.departments = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state) => { state.departmentsLoading = false; });
  },
});

export default usersSlice.reducer;
