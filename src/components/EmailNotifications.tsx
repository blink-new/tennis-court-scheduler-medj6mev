import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Send, CheckCircle, AlertCircle, Users, User } from 'lucide-react'
import { blink } from '@/blink/client'

interface Booking {
  id: string
  court: number
  timeSlot: string
  players: string[]
  type: 'singles' | 'doubles'
  date: string
}

interface EmailNotificationsProps {
  booking: Booking
  onEmailSent?: () => void
}

interface EmailTemplate {
  subject: string
  message: string
}

export function EmailNotifications({ booking, onEmailSent }: EmailNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [emailAddresses, setEmailAddresses] = useState<string[]>([''])
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>({
    subject: `Tennis Match Booking Confirmation - ${booking.date}`,
    message: `Hello,

Your tennis match has been booked successfully!

Match Details:
• Date: ${new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
• Time: ${booking.timeSlot}
• Court: ${booking.court}
• Match Type: ${booking.type === 'singles' ? 'Singles' : 'Doubles'}
• Players: ${booking.players.filter(p => p.trim()).join(', ')}

Please arrive 10 minutes before your scheduled time.

Best regards,
Tennis Court Management`
  })
  const [isSending, setIsSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const addEmailField = () => {
    setEmailAddresses([...emailAddresses, ''])
  }

  const removeEmailField = (index: number) => {
    if (emailAddresses.length > 1) {
      setEmailAddresses(emailAddresses.filter((_, i) => i !== index))
    }
  }

  const updateEmailAddress = (index: number, value: string) => {
    const updated = [...emailAddresses]
    updated[index] = value
    setEmailAddresses(updated)
  }

  const validateEmails = () => {
    const validEmails = emailAddresses.filter(email => {
      const trimmed = email.trim()
      return trimmed && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    })
    return validEmails
  }

  const sendNotifications = async () => {
    const validEmails = validateEmails()
    
    if (validEmails.length === 0) {
      setErrorMessage('Please enter at least one valid email address.')
      setSendStatus('error')
      return
    }

    if (!emailTemplate.subject.trim() || !emailTemplate.message.trim()) {
      setErrorMessage('Please fill in both subject and message.')
      setSendStatus('error')
      return
    }

    setIsSending(true)
    setSendStatus('idle')
    setErrorMessage('')

    try {
      // Send emails to all valid addresses
      const emailPromises = validEmails.map(email => 
        blink.notifications.email({
          to: email,
          subject: emailTemplate.subject,
          html: emailTemplate.message.replace(/\n/g, '<br>'),
          text: emailTemplate.message
        })
      )

      const results = await Promise.allSettled(emailPromises)
      
      // Check if all emails were sent successfully
      const failedEmails = results.filter(result => result.status === 'rejected')
      
      if (failedEmails.length === 0) {
        setSendStatus('success')
        onEmailSent?.()
        
        // Close dialog after 2 seconds
        setTimeout(() => {
          setIsOpen(false)
          setSendStatus('idle')
        }, 2000)
      } else {
        setErrorMessage(`Failed to send ${failedEmails.length} out of ${validEmails.length} emails.`)
        setSendStatus('error')
      }
    } catch (error) {
      setErrorMessage('Failed to send email notifications. Please try again.')
      setSendStatus('error')
    } finally {
      setIsSending(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Send Notifications
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Email Notifications
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Send booking confirmation emails to players
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {booking.type === 'singles' ? (
                  <User className="h-5 w-5 text-green-600" />
                ) : (
                  <Users className="h-5 w-5 text-blue-600" />
                )}
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Date:</span> {formatDate(booking.date)}
                </div>
                <div>
                  <span className="font-medium">Time:</span> {booking.timeSlot}
                </div>
                <div>
                  <span className="font-medium">Court:</span> {booking.court}
                </div>
                <div>
                  <span className="font-medium">Type:</span>
                  <Badge variant="secondary" className="ml-2">
                    {booking.type === 'singles' ? 'Singles' : 'Doubles'}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="font-medium">Players:</span> {booking.players.filter(p => p.trim()).join(', ')}
              </div>
            </CardContent>
          </Card>

          {/* Email Addresses */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Email Addresses</label>
            {emailAddresses.map((email, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => updateEmailAddress(index, e.target.value)}
                  className="flex-1"
                />
                {emailAddresses.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeEmailField(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addEmailField}>
              Add Another Email
            </Button>
          </div>

          {/* Email Template */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Email Subject</label>
            <Input
              value={emailTemplate.subject}
              onChange={(e) => setEmailTemplate({ ...emailTemplate, subject: e.target.value })}
              placeholder="Email subject"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Email Message</label>
            <Textarea
              value={emailTemplate.message}
              onChange={(e) => setEmailTemplate({ ...emailTemplate, message: e.target.value })}
              placeholder="Email message"
              rows={8}
              className="resize-none"
            />
          </div>

          {/* Status Messages */}
          {sendStatus === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Email notifications sent successfully!
              </AlertDescription>
            </Alert>
          )}

          {sendStatus === 'error' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Send Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={sendNotifications} 
              disabled={isSending}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isSending ? 'Sending...' : 'Send Notifications'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}