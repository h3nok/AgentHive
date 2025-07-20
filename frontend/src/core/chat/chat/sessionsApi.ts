/*
  React-Query replacement for the previous RTK-Query slice.
  Exports hooks with the SAME names so no component changes are needed.
*/

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Use environment var when provided, otherwise default to local backend port
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface SessionSummary {
  session_id: string;
  title?: string;
  pinned?: boolean;
  updated_at: string;
  preview?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "assistant" | "system";
  timestamp: string;
  agent?: string;
}

export interface Session extends SessionSummary {
  messages: ChatMessage[];
}

export interface CreateSessionBody {
  title?: string;
}

export interface UpdateSessionBody {
  title?: string;
  pinned?: boolean;
}

export const sessionsApi = createApi({
  reducerPath: "sessionsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL + '/api/v1',
    prepareHeaders: async (headers) => {
      let token = localStorage.getItem('access_token');
      if (!token) {
        try {
          const { msalInstance } = await import('../../../shared/utils/msalInstance');
          const { loginRequest } = await import('../../../shared/utils/authConfig');
          const account = msalInstance.getActiveAccount();
          if (account) {
            const result = await msalInstance.acquireTokenSilent({ ...loginRequest, account });
            token = result.accessToken;
          }
        } catch {
          // silent fail
        }
      }
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Session"],
  endpoints: (builder) => ({
    listSessions: builder.query<SessionSummary[], number | void>({
      query: (limit = 50) => `/sessions?limit=${limit}&t=${Date.now()}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ session_id }) => ({ type: "Session" as const, id: session_id })),
              { type: "Session", id: "LIST" },
            ]
          : [{ type: "Session", id: "LIST" }],
    }),
    createSession: builder.mutation<SessionSummary, CreateSessionBody>({
      query: (body) => ({ url: "/sessions", method: "POST", body }),
      invalidatesTags: [{ type: "Session", id: "LIST" }],
    }),
    getSession: builder.query<Session, string>({
      query: (id) => `/sessions/${id}?t=${Date.now()}`,
      providesTags: (result, error, id) => [{ type: "Session", id }],
    }),
    updateSession: builder.mutation<void, { id: string; changes: UpdateSessionBody }>({
      query: ({ id, changes }) => ({ url: `/sessions/${id}`, method: "PATCH", body: changes }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Session", id },
        { type: "Session", id: "LIST" },
      ],
    }),
    deleteSession: builder.mutation<void, string>({
      query: (id) => ({ url: `/sessions/${id}?id=${id}`, method: "DELETE" }),
      invalidatesTags: (result, error, id) => [
        { type: "Session", id },
        { type: "Session", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useListSessionsQuery,
  useCreateSessionMutation,
  useGetSessionQuery,
  useUpdateSessionMutation,
  useDeleteSessionMutation,
} = sessionsApi; 