import { useQuery } from '@tanstack/react-query'
import { api, unwrap } from '../api/client'

export const meKey = ['me', 'profile']
export const useMe = () => useQuery({ queryKey: meKey, queryFn: () => unwrap(api.GET('/me')) })
