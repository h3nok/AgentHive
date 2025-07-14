/* React Query hooks for sessions – incremental migration. */

import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import api from '../../../shared/utils/apiClient'

export interface SessionSummary {
  session_id: string
  title?: string
  pinned?: boolean
  updated_at: string
  preview?: string
}

export interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'assistant' | 'system'
  timestamp: string
  agent?: string
}

export interface Session extends SessionSummary {
  messages: ChatMessage[]
}

export interface CreateSessionBody {
  title?: string
}

export interface UpdateSessionBody {
  title?: string
  pinned?: boolean
}

const listSessionsKey: QueryKey = ['sessions']

export const useSessions = (limit = 50) =>
  useQuery({
    queryKey: [...listSessionsKey, limit],
    queryFn: async () => {
      const { data } = await api.get<SessionSummary[]>(`/v1/sessions?limit=${limit}`)
      return data
    },
    staleTime: 30_000,
  })

export const useSession = (id: string, enabled = true) =>
  useQuery({
    queryKey: ['session', id],
    queryFn: async () => {
      const { data } = await api.get<Session>(`/v1/sessions/${id}`)
      return data
    },
    enabled,
  })

// Utility to mimic RTK-Query tuple return
function wrapMutation<TData, TVars>(m: ReturnType<typeof useMutation<TData, unknown, TVars>>) {
  const caller = (vars: TVars) => ({ unwrap: () => m.mutateAsync(vars) })
  return [caller, { data: m.data, error: m.error, isLoading: m.isLoading }] as const
}

export const useCreateSession = () => {
  const qc = useQueryClient()
  const m = useMutation<SessionSummary, unknown, CreateSessionBody>({
    mutationFn: async (body) => (await api.post('/v1/sessions', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: listSessionsKey }),
  })
  return wrapMutation(m)
}

export const useUpdateSession = () => {
  const qc = useQueryClient()
  const m = useMutation<void, unknown, { id: string; changes: UpdateSessionBody }>({
    mutationFn: async ({ id, changes }) => {
      await api.patch(`/v1/sessions/${id}`, changes)
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['session', id] })
      qc.invalidateQueries({ queryKey: listSessionsKey })
    },
  })
  return wrapMutation(m)
}

export const useDeleteSession = () => {
  const qc = useQueryClient()
  const m = useMutation<void, unknown, string>({
    mutationFn: async (id) => {
      await api.delete(`/v1/sessions/${id}`)
    },
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['session', id] })
      qc.invalidateQueries({ queryKey: listSessionsKey })
    },
  })
  return wrapMutation(m)
}

// ------------------------------------------------------------------
// Compatibility re-exports so existing components can import
// from "sessionsHooks" without renaming, or we can alias paths.
// ------------------------------------------------------------------

export const useListSessionsQuery = useSessions
export const useGetSessionQuery = useSession
export const useCreateSessionMutation = useCreateSession
export const useUpdateSessionMutation = useUpdateSession
export const useDeleteSessionMutation = useDeleteSession 