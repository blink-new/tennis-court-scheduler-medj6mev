import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BarChart3, Trophy, Clock, Users, User, Calendar } from 'lucide-react'

interface PlayerStat {
  name: string
  totalMatches: number
  singlesMatches: number
  doublesMatches: number
  totalHours: number
  favoriteCourt: number
  lastPlayed: string
}

interface Booking {
  id: string
  court: number
  timeSlot: string
  players: string[]
  type: 'singles' | 'doubles'
  date: string
}

interface PlayerStatsProps {
  bookings: Booking[]
}

export function PlayerStats({ bookings }: PlayerStatsProps) {
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    calculatePlayerStats()
  }, [bookings, calculatePlayerStats])

  const calculatePlayerStats = useCallback(() => {
    const statsMap = new Map<string, PlayerStat>()

    // Process all bookings to calculate stats
    bookings.forEach(booking => {
      const matchDuration = booking.type === 'singles' ? 1 : 2 // hours
      const courtCounts = new Map<number, number>()

      booking.players.forEach(playerName => {
        if (!playerName.trim()) return

        const existing = statsMap.get(playerName) || {
          name: playerName,
          totalMatches: 0,
          singlesMatches: 0,
          doublesMatches: 0,
          totalHours: 0,
          favoriteCourt: 1,
          lastPlayed: booking.date
        }

        existing.totalMatches += 1
        existing.totalHours += matchDuration
        
        if (booking.type === 'singles') {
          existing.singlesMatches += 1
        } else {
          existing.doublesMatches += 1
        }

        // Update last played date if this booking is more recent
        if (new Date(booking.date) > new Date(existing.lastPlayed)) {
          existing.lastPlayed = booking.date
        }

        statsMap.set(playerName, existing)
      })
    })

    // Calculate favorite court for each player
    statsMap.forEach((stats, playerName) => {
      const courtCounts = new Map<number, number>()
      
      bookings.forEach(booking => {
        if (booking.players.includes(playerName)) {
          courtCounts.set(booking.court, (courtCounts.get(booking.court) || 0) + 1)
        }
      })

      let maxCount = 0
      let favoriteCourt = 1
      courtCounts.forEach((count, court) => {
        if (count > maxCount) {
          maxCount = count
          favoriteCourt = court
        }
      })

      stats.favoriteCourt = favoriteCourt
    })

    const sortedStats = Array.from(statsMap.values()).sort((a, b) => b.totalMatches - a.totalMatches)
    setPlayerStats(sortedStats)
  }, [bookings])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getTopPlayers = () => {
    return playerStats.slice(0, 5)
  }

  const getTotalStats = () => {
    return {
      totalPlayers: playerStats.length,
      totalMatches: playerStats.reduce((sum, p) => sum + p.totalMatches, 0),
      totalHours: playerStats.reduce((sum, p) => sum + p.totalHours, 0),
      avgMatchesPerPlayer: playerStats.length > 0 ? 
        (playerStats.reduce((sum, p) => sum + p.totalMatches, 0) / playerStats.length).toFixed(1) : '0'
    }
  }

  const totalStats = getTotalStats()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Player Statistics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Player Statistics
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{totalStats.totalPlayers}</div>
                <div className="text-sm text-muted-foreground">Total Players</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{totalStats.totalMatches}</div>
                <div className="text-sm text-muted-foreground">Total Matches</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{totalStats.totalHours}h</div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{totalStats.avgMatchesPerPlayer}</div>
                <div className="text-sm text-muted-foreground">Avg Matches</div>
              </CardContent>
            </Card>
          </div>

          {/* Top Players */}
          {playerStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Top Players
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getTopPlayers().map((player, index) => (
                    <div key={player.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Court {player.favoriteCourt} • Last played {formatDate(player.lastPlayed)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{player.totalMatches}</div>
                        <div className="text-sm text-muted-foreground">matches</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Player Stats */}
          {playerStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">All Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {playerStats.map((player) => (
                    <div key={player.name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="font-medium">{player.name}</div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {player.singlesMatches} singles
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {player.doublesMatches} doubles
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {player.totalHours}h
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Court {player.favoriteCourt}
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {player.totalMatches} matches
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {playerStats.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No player statistics available yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Start booking matches to see player stats!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}