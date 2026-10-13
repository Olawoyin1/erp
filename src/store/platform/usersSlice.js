import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userService, roleService, departmentService, locationService } from '../../services/platform.service';
import { thunkError } from './thunkError';

// Every thunk rejects with `{ message, status, fieldErrors }` (see thunkError).

const call = (fn, fallback) => async (arg, { rejectWithValue }) => {
  try {
    return await fn(arg);
  } catch (err) {
    return rejectWithValue(thunkError(err, fallback));
  }
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  call(async (params = {}) => {
    const { data } = await userService.list(params);
    return { users: data.data, meta: data.meta };
  }, 'Failed to load users'),
);

export const inviteUser = createAsyncThunk(
  'users/inviteUser',
  call(async (payload) => (await userService.invite(payload)).data.data, 'Failed to invite user'),
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  call(async ({ id, ...payload }) => (await userService.update(id, payload)).data.data, 'Failed to update user'),
);

export const setUserStatus = createAsyncThunk(
  'users/setUserStatus',
  call(async ({ id, status, reason }) => (await userService.setStatus(id, status, reason)).data.data, 'Failed to update status'),
);

export const setUserRoles = createAsyncThunk(
  'users/setUserRoles',
  call(async ({ id, roleIds }) => (await userService.setRoles(id, roleIds)).data.data, 'Failed to update roles'),
);

export const sendPasswordReset = createAsyncThunk(
  'users/sendPasswordReset',
  call(async (id) => {
    await userService.sendPasswordReset(id);
    return id;
  }, 'Failed to send reset link'),
);

export const resendUserInvite = createAsyncThunk(
  'users/resendInvite',
  call(async (id) => {
    await userService.resendInvite(id);
    return id;
  }, 'Failed to resend invite'),
);

export const cancelUserInvite = createAsyncThunk(
  'users/cancelInvite',
  call(async ({ id, reason }) => {
    await userService.cancelInvite(id, reason);
    return id;
  }, 'Failed to cancel invite'),
);

// ─── Roles ────────────────────────────────────────────────────────────────────
export const fetchRoles = createAsyncThunk(
  'users/fetchRoles',
  call(async () => (await roleService.list()).data.data, 'Failed to load roles'),
);

export const createRole = createAsyncThunk(
  'users/createRole',
  call(async (payload) => (await roleService.create(payload)).data.data, 'Failed to create role'),
);

export const updateRole = createAsyncThunk(
  'users/updateRole',
  call(async ({ id, ...payload }) => (await roleService.update(id, payload)).data.data, 'Failed to update role'),
);

export const deleteRole = createAsyncThunk(
  'users/deleteRole',
  call(async (id) => {
    await roleService.delete(id);
    return id;
  }, 'Failed to delete role'),
);

export const fetchPermissions = createAsyncThunk(
  'users/fetchPermissions',
  call(async () => (await roleService.getPermissions()).data.data, 'Failed to load permissions'),
);

// ─── Pickers ──────────────────────────────────────────────────────────────────
export const fetchDepartments = createAsyncThunk(
  'users/fetchDepartments',
  call(async () => (await departmentService.list()).data.data, 'Failed to load departments'),
);

export const fetchLocations = createAsyncThunk(
  'users/fetchLocations',
  call(async () => (await locationService.list()).data.data, 'Failed to load locations'),
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
    usersLoading: false,
    usersError: null,

    roles: [],
    rolesLoading: false,
    rolesError: null,

    permissionCatalogue: null,
    permissionsLoading: false,

    departments: [],
    departmentsLoading: false,
    departmentsError: null,

    locations: [],
  },
  reducers: {},
  extraReducers: (builder) => {
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
        state.usersError = action.payload?.message || 'Failed to load users';
      });

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
        state.rolesError = action.payload?.message || 'Failed to load roles';
      });

    builder
      .addCase(fetchPermissions.pending, (state) => { state.permissionsLoading = true; })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.permissionsLoading = false;
        state.permissionCatalogue = action.payload;
      })
      .addCase(fetchPermissions.rejected, (state) => { state.permissionsLoading = false; });

    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.departmentsLoading = true;
        state.departmentsError = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.departmentsLoading = false;
        state.departments = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.departmentsLoading = false;
        state.departmentsError = action.payload?.message || 'Failed to load departments';
      });

    builder.addCase(fetchLocations.fulfilled, (state, action) => {
      state.locations = action.payload;
    });
  },
});

export default usersSlice.reducer;
