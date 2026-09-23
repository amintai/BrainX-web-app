import { createSlice } from '@reduxjs/toolkit';

// Placeholder client-only UI state (Redux holds no API data, no auth session — ADR-8).
const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: false },
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
  },
});

export const { toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;
