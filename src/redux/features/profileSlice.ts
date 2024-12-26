import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ProfileState {
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  name: null,
  email: null,
  phone: null,
  address: null,
  loading: false,
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfileData: (state, action: PayloadAction<Partial<ProfileState>>) => {
      return { ...state, ...action.payload, error: null };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearProfile: () => {
      return initialState;
    },
  },
});

export const { setProfileData, setLoading, setError, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
