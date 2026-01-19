'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Smartphone, CheckCircle, AlertCircle, RotateCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { initiateM2mDeposit, checkTransactionStatus } from '@/lib/xprizo/client'

interface XprizoM2mDepositProps {
  merchantWalletId: string
  onSuccess?: (transactionRef: string) => void
}

export function XprizoM2mDeposit({ merchantWalletId, onSuccess }: XprizoM2mDepositProps) {
  const { toast } = useToast()
  
  const [step, setStep] = useState<'input' | 'waiting' | 'success' | 'error'>('input')
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactionRef, setTransactionRef] = useState<string>('')
  
  const [formData, setFormData] = useState({
    phoneNumber: '',
    amount: '',
  })

  // Validate phone number format (international format)
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10,}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  // Validate amount
  const validateAmount = (amount: string): boolean => {
    const num = parseFloat(amount)
    return num > 0 && num <= 999999
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'amount') {
      // Only allow numbers and decimal point
      if (!/^\d*\.?\d*$/.test(value)) return
    }
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleInitiateDeposit = async () => {
    setError(null)

    // Validation
    if (!formData.phoneNumber.trim()) {
      setError('Please enter your M-Pesa phone number')
      return
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      setError('Please enter a valid phone number (e.g., +254712345678 or 0712345678)')
      return
    }

    if (!formData.amount) {
      setError('Please enter an amount')
      return
    }

    if (!validateAmount(formData.amount)) {
      setError('Amount must be between $1 and $999,999')
      return
    }

    setIsLoading(true)

    try {
      const amount = parseFloat(formData.amount)
      const ref = `XP${Date.now()}${Math.random().toString(36).substr(2, 9)}`

      const response = await initiateM2mDeposit({
        mobileNumber: formData.phoneNumber,
        accountId: merchantWalletId,
        amount,
        reference: ref,
      })

      setTransactionRef(ref)
      setStep('waiting')

      toast({
        title: 'M-Pesa Request Sent',
        description: 'Enter your M-Pesa PIN on your phone to complete the transaction',
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate M-Pesa deposit'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckStatus = async () => {
    if (!transactionRef) return

    setIsChecking(true)
    try {
      const status = await checkTransactionStatus(transactionRef)

      if (status.status === 'completed' || status.status === 'success') {
        setStep('success')
        toast({
          title: 'Transaction Successful!',
          description: `$${formData.amount} has been added to your account`,
        })
        onSuccess?.(transactionRef)
      } else if (status.status === 'failed' || status.status === 'error') {
        setStep('error')
        setError(status.message || 'Transaction failed')
        toast({
          title: 'Transaction Failed',
          description: status.message || 'The transaction could not be processed',
          variant: 'destructive',
        })
      } else {
        // Still pending
        toast({
          title: 'Still Processing',
          description: 'Please wait or check again in a moment',
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check status'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsChecking(false)
    }
  }

  const handleReset = () => {
    setStep('input')
    setFormData({ phoneNumber: '', amount: '' })
    setError(null)
    setTransactionRef('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          M-Pesa Deposit
        </CardTitle>
        <CardDescription>Add money to your account using M-Pesa</CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'input' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="+254712345678"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                disabled={isLoading}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Use international format (e.g., +254712345678) or local format (0712345678)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                name="amount"
                type="text"
                placeholder="100"
                value={formData.amount}
                onChange={handleInputChange}
                disabled={isLoading}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Minimum: $1 | Maximum: $999,999
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleInitiateDeposit}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initiating...
                </>
              ) : (
                'Send M-Pesa Request'
              )}
            </Button>
          </div>
        )}

        {step === 'waiting' && (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-pulse">
                <Smartphone className="h-12 w-12 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">Waiting for Confirmation</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Enter your M-Pesa PIN on your phone to complete the transaction
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  Transaction ID: {transactionRef}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleCheckStatus}
                disabled={isChecking}
                variant="outline"
                className="w-full bg-transparent"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking Status...
                  </>
                ) : (
                  <>
                    <RotateCw className="mr-2 h-4 w-4" />
                    Check Status
                  </>
                )}
              </Button>
              <Button
                onClick={handleReset}
                variant="ghost"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <div className="text-center">
                <p className="font-semibold text-lg text-green-600">Transaction Successful</p>
                <p className="text-sm text-muted-foreground mt-2">
                  ${formData.amount} has been added to your account
                </p>
              </div>
            </div>

            <Button onClick={handleReset} className="w-full">
              Make Another Deposit
            </Button>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4 py-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Transaction failed. Please try again.'}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button
                onClick={handleCheckStatus}
                disabled={isChecking}
                variant="outline"
                className="w-full bg-transparent"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RotateCw className="mr-2 h-4 w-4" />
                    Check Status Again
                  </>
                )}
              </Button>
              <Button onClick={handleReset} className="w-full">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
