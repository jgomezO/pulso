'use client'

import { useState } from 'react'
import { Button, Card, Input, Label, TextField } from '@heroui/react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setIsLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <Card className="w-full max-w-sm shadow-xl">
      <Card.Header className="flex flex-col items-center pb-0 pt-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Pulso</span>
        </div>
        <p className="text-sm text-gray-500">Customer Success AI</p>
      </Card.Header>
      <Card.Content className="py-6 px-6">
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <TextField
            value={email}
            onChange={(value: string) => setEmail(value)}
            isRequired
          >
            <Label>Email</Label>
            <Input type="email" placeholder="tu@empresa.com" className="w-full" />
          </TextField>
          <TextField
            value={password}
            onChange={(value: string) => setPassword(value)}
            isRequired
          >
            <Label>Contraseña</Label>
            <Input type="password" placeholder="••••••••" className="w-full" />
          </TextField>
          <Button
            type="submit"
            variant="primary"
            isDisabled={isLoading}
            className="w-full mt-2"
          >
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>
      </Card.Content>
    </Card>
  )
}
