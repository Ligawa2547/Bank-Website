'use client'

import React from "react"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Send, CheckCircle, AlertCircle, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { verifyWalletRecipient, requestWalletTransfer } from '@/lib/xprizo/client'
import { useAuth } from '@/lib/auth-provider'

interface WalletTransferProps {
  onSuccess?: (transactionRef: string) => void
}

interface RecipientInfo {
  accountNumber: string
  name: string
  email: string
}

type Step = 'input' | 'verify' | 'confirm' | 'processing' | 'success' | 'error'

export function XprizoWalletTransfer({ onSuccess }: WalletTransferProps) {
  const { profile } = useAuth()
  const { toast } = useToast()

  const [step, setStep] = useState<Step>('input')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactionRef, setTransactionRef] = useState<string>('')
  const [recipient, setRecipient] = useState<RecipientInfo | null>(null)

  const [formData, setFormData] = useState({
    recipientAccountNumber: '',
    amount: '',
    description: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'amount') {
      if (!/^\d*\.?\d*$/.test(value)) return
    }
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSearchRecipient = async () => {
    setError(null)

    if (!formData.recipientAccountNumber.trim()) {
      setError('Please enter recipient account number')
      return
    }

    // Prevent self-transfer
    if (formData.recipientAccountNumber === profile?.account_no) {
      setError('You cannot transfer money to your own account')
      return
    }

    setIsLoading(true)

    try {
      const recipientData = await verifyWalletRecipient(formData.recipientAccountNumber)
      setRecipient({
        accountNumber: formData.recipientAccountNumber,
        name: recipientData.name || recipientData.fullName || 'Unknown',
        email: recipientData.email || '',
      })
      setStep('verify')

      toast({
        title: 'Recipient Found',
        description: `Recipient: ${recipientData.name || 'Unknown'}`,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Recipient account not found'
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

  const handleConfirmTransfer = () => {
    setError(null)

    if (!formData.amount) {
      setError('Please enter an amount')
      return
    }

    const amount = parseFloat(formData.amount)
    if (amount <= 0 || amount > 999999) {
      setError('Amount must be between $1 and $999,999')
      return
    }

    setStep('confirm')
  }

  const handleExecuteTransfer = async () => {
    if (!recipient) return

    setIsLoading(true)
    setStep('processing')

    try {
      const ref = `XW${Date.now()}${Math.random().toString(36).substr(2, 9)}`
      const amount = parseFloat(formData.amount)

      const response = await requestWalletTransfer({
        recipientAccountNumber: recipient.accountNumber,
        amount,
        reference: ref,
        description: formData.description || 'Wallet transfer',
      })

      setTransactionRef(ref)
      setStep('success')

      toast({
        title: 'Transfer Successful',
        description: `$${formData.amount} sent to ${recipient.name}`,
      })

      onSuccess?.(ref)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transfer failed'
      setError(errorMessage)
      setStep('error')

      toast({
        title: 'Transfer Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setStep('input')
    setFormData({ recipientAccountNumber: '', amount: '', description: '' })
    setError(null)
    setTransactionRef('')
    setRecipient(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Wallet to Wallet Transfer
        </CardTitle>
        <CardDescription>Send money to another Alghahim Virtual Bank account</CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'input' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipientAccountNumber">Recipient Account Number</Label>
              <div className="flex gap-2">
                <Input
                  id="recipientAccountNumber"
                  name="recipientAccountNumber"
                  placeholder="Enter account number"
                  value={formData.recipientAccountNumber}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSearchRecipient}
                  disabled={isLoading || !formData.recipientAccountNumber.trim()}
                  variant="outline"
                  size="icon"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === 'verify' && recipient && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Recipient Found: <strong>{recipient.name}</strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                name="amount"
                type="text"
                placeholder="100"
                value={formData.amount}
                onChange={handleInputChange}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Minimum: $1 | Maximum: $999,999
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                name="description"
                type="text"
                placeholder="e.g., Payment for services"
                value={formData.description}
                onChange={handleInputChange}
                maxLength={100}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Button
                onClick={handleConfirmTransfer}
                disabled={isLoading || !formData.amount}
                className="w-full"
              >
                Continue
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full bg-transparent"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && recipient && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please review the transfer details before confirming
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">To:</span>
                <span className="font-semibold">{recipient.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account:</span>
                <span className="font-mono text-sm">{recipient.accountNumber}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold text-lg">${formData.amount}</span>
              </div>
              {formData.description && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Note:</span>
                  <span className="text-sm">{formData.description}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleExecuteTransfer}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Transfer'
                )}
              </Button>
              <Button
                onClick={() => setStep('verify')}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                Back
              </Button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin">
                <Loader2 className="h-12 w-12 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">Processing Transfer</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please wait while we process your transfer...
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && recipient && (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <div className="text-center">
                <p className="font-semibold text-lg text-green-600">Transfer Successful</p>
                <p className="text-sm text-muted-foreground mt-2">
                  ${formData.amount} has been sent to {recipient.name}
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  Transaction ID: {transactionRef}
                </p>
              </div>
            </div>

            <Button onClick={handleReset} className="w-full">
              Make Another Transfer
            </Button>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4 py-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Transfer failed. Please try again.'}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button
                onClick={() => setStep('confirm')}
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
              <Button onClick={handleReset} className="w-full">
                Start Over
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
