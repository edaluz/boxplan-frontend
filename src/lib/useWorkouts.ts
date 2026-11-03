import { useQuery } from '@tanstack/react-query'
import { api, unwrap } from '../api/client'

export const workoutsKey = (groupId: string) => ['workouts', groupId]

export function useWorkouts(groupId: string, from: string, to: string) {
  return useQuery({
    queryKey: [...workoutsKey(groupId), from, to],
    queryFn: () =>
      unwrap(api.GET('/groups/{id}/workouts', { params: { path: { id: groupId }, query: { from, to } } })),
  })
}
