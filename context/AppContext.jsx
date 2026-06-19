'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePathname, useRouter } from 'next/navigation'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const router = useRouter()
  const pathname = usePathname()

  const [user, setUser] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [toast, setToast] = useState(null)
  const [profile, setProfile] = useState(null)

  const publicRoutes = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ]
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  )

  const showToast = ({ type = 'success', message }) => {
    setToast({ type, message })

    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  const hideToast = () => setToast(null)

  const logout = async () => {
    await supabase.auth.signOut()

    setUser(null)
    router.replace('/') // or /login
  }

  // const loadAppData = async (currentUser, silent = false) => {
  //   if (!silent) setInitialLoading(true)
  //   if (silent) setRefreshing(true)

  //   const publicOnlyRoutes = [
  //     '/login',
  //     '/signup',
  //     '/forgot-password',
  //     '/reset-password',
  //   ]

  //   setUser(currentUser)

  //   if (!currentUser) {
  //     setInitialLoading(false)
  //     setRefreshing(false)
  //     return
  //   }

  //   const isPublicOnlyRoute = publicOnlyRoutes.some((route) =>
  //     pathname.startsWith(route)
  //   )

  //   if (pathname === '/' || isPublicOnlyRoute) {
  //     router.replace('/dashboard')
  //   }
    
  //   const { data: profileData } = await supabase
  //     .from('profiles')
  //     .select('*')
  //     .eq('id', currentUser.id)
  //     .maybeSingle()

  //   setProfile(profileData || null)

  //   setInitialLoading(false)
  //   setRefreshing(false)
  // }

  // useEffect(() => {
  //   // supabase.auth.getSession().then(({ data }) => {
  //   //   loadAppData(data.session?.user || null)
  //   // })

  //   const {
  //     data: { subscription },
  //   } = supabase.auth.onAuthStateChange((event, session) => {
  //     if (event === 'SIGNED_OUT' || !session) {
  //       loadAppData(null, true)
  //       setUser(null)

  //       if (!isPublicRoute) {
  //         router.replace('/')
  //       }
  //       return
  //     }

  //     // silent refresh = no full-page loader
  //     loadAppData(session.user, true)
  //   })

  //   return () => subscription.unsubscribe()
  // }, [])

  // useEffect(() => {
  //   let isMounted = true

  //   const clearAuthData = () => {
  //     if (!isMounted) return

  //     loadAppData(null, true)
  //     setUser(null)

  //     if (!isPublicRoute) {
  //       router.replace('/')
  //     }
  //   }

  //   const initSession = async () => {
  //     const { data, error } = await supabase.auth.getSession()

  //     if (
  //       error ||
  //       !data.session ||
  //       error?.message?.includes('Invalid Refresh Token') ||
  //       error?.message?.includes('Refresh Token Not Found')
  //     ) {
  //       await supabase.auth.signOut()
  //       clearAuthData()
  //       return
  //     }

  //     loadAppData(data.session.user || null)
  //   }

  //   initSession()

  //   const {
  //     data: { subscription },
  //   } = supabase.auth.onAuthStateChange(async (event, session) => {
  //     if (event === 'SIGNED_OUT' || !session) {
  //       clearAuthData()
  //       return
  //     }

  //     loadAppData(session.user, true)
  //   })

  //   return () => {
  //     isMounted = false
  //     subscription.unsubscribe()
  //   }
  // }, [isPublicRoute, router])

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        setProfile,
        initialLoading,
        refreshing,
        refreshAppData: () => loadAppData(user, true),
        logout,

        toast,
        showToast,
        hideToast,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}