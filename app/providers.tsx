'use client'

import { Toast } from '@heroui/react'
import { AuthProvider } from '@/components/providers/AuthProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toast.Provider placement="top end">
        {({ toast: t }) => (
          <Toast toast={t} variant={t.content.variant}>
            <Toast.Content>
              <Toast.Title>{t.content.title}</Toast.Title>
              {t.content.description && (
                <Toast.Description>{t.content.description}</Toast.Description>
              )}
            </Toast.Content>
            <Toast.CloseButton />
          </Toast>
        )}
      </Toast.Provider>
    </AuthProvider>
  )
}
