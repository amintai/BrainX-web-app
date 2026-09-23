import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../utils/supabase';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  user: User | null;
  status: AuthStatus;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
};

export const refreshUser = createAsyncThunk('auth/refreshUser', async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await supabase.auth.signOut();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.status = action.payload ? 'authenticated' : 'unauthenticated';
    },
    forceLogout: (state) => {
      state.user = null;
      state.status = 'unauthenticated';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshUser.pending, (state) => {
        if (state.status === 'idle') state.status = 'loading';
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = action.payload ? 'authenticated' : 'unauthenticated';
      })
      .addCase(refreshUser.rejected, (state) => {
        state.status = 'unauthenticated';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.status = 'unauthenticated';
      });
  },
});

export const { setUser, forceLogout } = authSlice.actions;
export default authSlice.reducer;
