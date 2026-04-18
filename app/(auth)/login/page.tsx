'use client'

import { useSearchParams } from 'next/navigation'
import { Button, Alert } from '@heroui/react'
import { useAuthContext } from '@/components/providers/AuthProvider'

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09A6.97 6.97 0 015.5 12c0-.72.12-1.42.34-2.09V7.07H2.18A11.96 11.96 0 001 12c0 1.94.46 3.77 1.18 5.07l3.66-2.98z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const hasError = searchParams.get('error') === 'auth'
  const { signInWithGoogle } = useAuthContext()

  return (
    <div className="w-full max-w-sm bg-white border border-[#ECEEF5] rounded-[14px] p-10">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 bg-[#4F6EF7] rounded-[14px] flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <span className="text-2xl font-bold text-[#4F6EF7]">Pulso</span>
        </div>
        <p className="text-sm text-[#6B7280]">Customer Success con AI</p>
      </div>

      {/* Error alert */}
      {hasError && (
        <Alert color="danger" className="mb-6">
          Error al iniciar sesión. Intenta de nuevo.
        </Alert>
      )}

      {/* Google button */}
      <Button
        variant="secondary"
        onPress={signInWithGoogle}
        className="w-full h-12 text-sm font-medium border border-[#ECEEF5] rounded-xl"
      >
        <GoogleIcon />
        Continuar con Google
      </Button>

      {/* Legal */}
      <p className="text-xs text-[#9CA3AF] text-center mt-6 leading-relaxed">
        Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.
      </p>
    </div>
  )
}
