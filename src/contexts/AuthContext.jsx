'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserDoc, createUserDoc } from '@/lib/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userDoc, setUserDoc] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        let doc = await getUserDoc(firebaseUser.uid)
        if (!doc) {
          const role = await createUserDoc(firebaseUser.uid, {
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          })
          doc = await getUserDoc(firebaseUser.uid)
        }
        setUserDoc(doc)
      } else {
        setUser(null)
        setUserDoc(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return result.user
  }

  const logout = async () => {
    await signOut(auth)
  }

  const isAdmin = userDoc?.role === 'admin'

  const refreshUserDoc = async () => {
    if (user) {
      const doc = await getUserDoc(user.uid)
      setUserDoc(doc)
    }
  }

  return (
    <AuthContext.Provider value={{ user, userDoc, loading, isAdmin, loginWithGoogle, logout, refreshUserDoc }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
