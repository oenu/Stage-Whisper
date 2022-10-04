// Slice for managing requests to whisper and the queue of requests

const initialState = {
  requests: [],
  queue: []
};

const whisperSlice = createSlice({
  name: 'whisper',
  initialState,
  reducers: {
    addRequest: (state, action) => {
      state.requests.push(action.payload);
    }
  }
});

export const { addRequest } = whisperSlice.actions;

export default whisperSlice.reducer;
