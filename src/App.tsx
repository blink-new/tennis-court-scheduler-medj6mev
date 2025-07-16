import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Clock, Users, User, Trash2, AlertCircle, Mail } from 'lucide-react'
import { PlayerStats } from '@/components/PlayerStats'
import { EmailNotifications } from '@/components/EmailNotifications'

interface Booking {
  id: string
  court: number
  timeSlot: string
  players: string[]
  type: 'singles' | 'doubles'
  date: string
}

const TIME_SLOTS = {
  singles: ['5:00-6:00 PM', '6:00-7:00 PM'],
  doubles: ['7:00-8:00 PM', '8:00-9:00 PM']
}

const COURTS = [1, 2, 3]

function App() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<{
    court: number
    timeSlot: string
    type: 'singles' | 'doubles'
  } | null>(null)
  const [playerInputs, setPlayerInputs] = useState<string[]>(['', '', '', ''])

  // Check if date is valid for court bookings (Sundays from September to April)
  const isValidBookingDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, etc.
    const month = date.getMonth() + 1 // 1-12
    
    // Must be Sunday
    if (dayOfWeek !== 0) return false
    
    // Must be September (9) to April (4) - crossing year boundary
    return month >= 9 || month <= 4
  }

  // Load all bookings for statistics
  const loadAllBookings = () => {
    const allBookingsData: Booking[] = []
    const keys = Object.keys(localStorage)
    
    keys.forEach(key => {
      if (key.startsWith('tennis-bookings-')) {
        const saved = localStorage.getItem(key)
        if (saved) {
          const dateBookings = JSON.parse(saved)
          allBookingsData.push(...dateBookings)
        }
      }
    })
    
    setAllBookings(allBookingsData)
  }

  // Load bookings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`tennis-bookings-${selectedDate}`)
    if (saved) {
      setBookings(JSON.parse(saved))
    } else {
      setBookings([])
    }
    
    // Load all bookings for statistics
    loadAllBookings()
  }, [selectedDate])

  // Save bookings to localStorage
  useEffect(() => {
    localStorage.setItem(`tennis-bookings-${selectedDate}`, JSON.stringify(bookings))
    // Reload all bookings when current bookings change
    loadAllBookings()
  }, [bookings, selectedDate])

  const getBooking = (court: number, timeSlot: string) => {
    return bookings.find(b => b.court === court && b.timeSlot === timeSlot)
  }

  const handleCellClick = (court: number, timeSlot: string, type: 'singles' | 'doubles') => {
    // Prevent booking on invalid dates
    if (!isValidBookingDate(selectedDate)) {
      return
    }
    
    const existing = getBooking(court, timeSlot)
    if (existing) {
      // Pad with empty strings if needed to match expected length
      const expectedLength = type === 'singles' ? 2 : 4
      const paddedPlayers = [...existing.players]
      while (paddedPlayers.length < expectedLength) {
        paddedPlayers.push('')
      }
      setPlayerInputs(paddedPlayers)
    } else {
      setPlayerInputs(type === 'singles' ? ['', ''] : ['', '', '', ''])
    }
    setEditingBooking({ court, timeSlot, type })
    setIsDialogOpen(true)
  }

  const handleSaveBooking = () => {
    if (!editingBooking) return

    const filteredPlayers = playerInputs.filter(p => p.trim())
    if (filteredPlayers.length === 0) {
      // Remove booking if no players
      setBookings(prev => prev.filter(b => 
        !(b.court === editingBooking.court && b.timeSlot === editingBooking.timeSlot)
      ))
    } else {
      const newBooking: Booking = {
        id: `${editingBooking.court}-${editingBooking.timeSlot}-${Date.now()}`,
        court: editingBooking.court,
        timeSlot: editingBooking.timeSlot,
        players: filteredPlayers,
        type: editingBooking.type,
        date: selectedDate
      }

      setBookings(prev => {
        const filtered = prev.filter(b => 
          !(b.court === editingBooking.court && b.timeSlot === editingBooking.timeSlot)
        )
        return [...filtered, newBooking]
      })
    }

    setIsDialogOpen(false)
    setEditingBooking(null)
    setPlayerInputs(['', '', '', ''])
  }

  const handleDeleteBooking = () => {
    if (!editingBooking) return
    
    setBookings(prev => prev.filter(b => 
      !(b.court === editingBooking.court && b.timeSlot === editingBooking.timeSlot)
    ))
    
    setIsDialogOpen(false)
    setEditingBooking(null)
    setPlayerInputs(['', '', '', ''])
  }

  const clearAllBookings = () => {
    setBookings([])
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Tennis Court Scheduler
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="date" className="text-sm font-medium">Date:</label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
                <div className="flex gap-2">
                  <PlayerStats bookings={allBookings} />
                  <Button 
                    variant="outline" 
                    onClick={clearAllBookings}
                    disabled={!isValidBookingDate(selectedDate)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground">{formatDate(selectedDate)}</p>
          </CardHeader>
        </Card>

        {/* Court Availability Alert */}
        {!isValidBookingDate(selectedDate) && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Courts are only available on Sundays from September to April.</strong>
              {new Date(selectedDate).getDay() !== 0 
                ? ' Please select a Sunday.' 
                : ' Please select a date during the tennis season (September - April).'}
            </AlertDescription>
          </Alert>
        )}

        {/* Legend */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <User className="h-3 w-3 mr-1" />
                  Singles (5-7 PM)
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Users className="h-3 w-3 mr-1" />
                  Doubles (7-9 PM)
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {isValidBookingDate(selectedDate) 
                  ? 'Click any cell to book or edit'
                  : 'Courts unavailable on this date'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Grid */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-4 gap-2">
              {/* Header Row */}
              <div className="font-semibold text-center p-3 bg-gray-100 rounded-lg">
                <Clock className="h-4 w-4 mx-auto mb-1" />
                Time
              </div>
              {COURTS.map(court => (
                <div key={court} className="font-semibold text-center p-3 bg-gray-100 rounded-lg">
                  Court {court}
                </div>
              ))}

              {/* Singles Section */}
              {TIME_SLOTS.singles.map(timeSlot => (
                <div key={timeSlot} className="contents">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg font-medium text-green-800 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm">{timeSlot}</div>
                      <Badge variant="secondary" className="mt-1 bg-green-100 text-green-700 text-xs">
                        <User className="h-3 w-3 mr-1" />
                        Singles
                      </Badge>
                    </div>
                  </div>
                  {COURTS.map(court => {
                    const booking = getBooking(court, timeSlot)
                    const isDateValid = isValidBookingDate(selectedDate)
                    return (
                      <div
                        key={`${court}-${timeSlot}`}
                        className={`p-3 border-2 border-dashed rounded-lg transition-colors min-h-[120px] flex items-center justify-center ${
                          isDateValid 
                            ? 'border-green-200 cursor-pointer hover:bg-green-50' 
                            : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                        }`}
                        onClick={() => handleCellClick(court, timeSlot, 'singles')}
                      >
                        {booking ? (
                          <div className="text-center space-y-2">
                            <div className={`font-medium text-sm ${isDateValid ? 'text-green-800' : 'text-gray-500'}`}>
                              {booking.players.filter(p => p.trim()).join(' vs ')}
                            </div>
                            <Badge variant="secondary" className={`text-xs ${
                              isDateValid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              Singles
                            </Badge>
                            {isDateValid && (
                              <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                <EmailNotifications booking={booking} />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={`text-sm opacity-60 ${isDateValid ? 'text-green-600' : 'text-gray-400'}`}>
                            {isDateValid ? 'Click to book' : 'Unavailable'}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}

              {/* Doubles Section */}
              {TIME_SLOTS.doubles.map(timeSlot => (
                <div key={timeSlot} className="contents">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg font-medium text-blue-800 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm">{timeSlot}</div>
                      <Badge variant="secondary" className="mt-1 bg-blue-100 text-blue-700 text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        Doubles
                      </Badge>
                    </div>
                  </div>
                  {COURTS.map(court => {
                    const booking = getBooking(court, timeSlot)
                    const isDateValid = isValidBookingDate(selectedDate)
                    return (
                      <div
                        key={`${court}-${timeSlot}`}
                        className={`p-3 border-2 border-dashed rounded-lg transition-colors min-h-[120px] flex items-center justify-center ${
                          isDateValid 
                            ? 'border-blue-200 cursor-pointer hover:bg-blue-50' 
                            : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                        }`}
                        onClick={() => handleCellClick(court, timeSlot, 'doubles')}
                      >
                        {booking ? (
                          <div className="text-center space-y-2">
                            <div className={`font-medium text-xs leading-tight ${isDateValid ? 'text-blue-800' : 'text-gray-500'}`}>
                              {booking.players.filter(p => p.trim()).join(' & ')}
                            </div>
                            <Badge variant="secondary" className={`text-xs ${
                              isDateValid ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              Doubles
                            </Badge>
                            {isDateValid && (
                              <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                <EmailNotifications booking={booking} />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={`text-sm opacity-60 ${isDateValid ? 'text-blue-600' : 'text-gray-400'}`}>
                            {isDateValid ? 'Click to book' : 'Unavailable'}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Booking Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingBooking?.type === 'singles' ? (
                  <User className="h-5 w-5 text-green-600" />
                ) : (
                  <Users className="h-5 w-5 text-blue-600" />
                )}
                {editingBooking?.type === 'singles' ? 'Singles' : 'Doubles'} Match
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Court {editingBooking?.court} • {editingBooking?.timeSlot}
              </p>
            </DialogHeader>
            
            <div className="space-y-4">
              {editingBooking?.type === 'singles' ? (
                <>
                  <div>
                    <label className="text-sm font-medium">Player 1</label>
                    <Input
                      value={playerInputs[0] || ''}
                      onChange={(e) => {
                        const newInputs = [...playerInputs]
                        newInputs[0] = e.target.value
                        setPlayerInputs(newInputs)
                      }}
                      placeholder="Enter first player name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Player 2</label>
                    <Input
                      value={playerInputs[1] || ''}
                      onChange={(e) => {
                        const newInputs = [...playerInputs]
                        newInputs[1] = e.target.value
                        setPlayerInputs(newInputs)
                      }}
                      placeholder="Enter second player name"
                      className="mt-1"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium">Player 1</label>
                    <Input
                      value={playerInputs[0] || ''}
                      onChange={(e) => {
                        const newInputs = [...playerInputs]
                        newInputs[0] = e.target.value
                        setPlayerInputs(newInputs)
                      }}
                      placeholder="Enter first player name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Player 2</label>
                    <Input
                      value={playerInputs[1] || ''}
                      onChange={(e) => {
                        const newInputs = [...playerInputs]
                        newInputs[1] = e.target.value
                        setPlayerInputs(newInputs)
                      }}
                      placeholder="Enter second player name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Player 3</label>
                    <Input
                      value={playerInputs[2] || ''}
                      onChange={(e) => {
                        const newInputs = [...playerInputs]
                        newInputs[2] = e.target.value
                        setPlayerInputs(newInputs)
                      }}
                      placeholder="Enter third player name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Player 4</label>
                    <Input
                      value={playerInputs[3] || ''}
                      onChange={(e) => {
                        const newInputs = [...playerInputs]
                        newInputs[3] = e.target.value
                        setPlayerInputs(newInputs)
                      }}
                      placeholder="Enter fourth player name"
                      className="mt-1"
                    />
                  </div>
                </>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveBooking} className="flex-1">
                  Save Booking
                </Button>
                {getBooking(editingBooking?.court || 0, editingBooking?.timeSlot || '') && (
                  <Button variant="destructive" onClick={handleDeleteBooking}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default App