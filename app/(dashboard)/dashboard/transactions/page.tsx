"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react"
import { toast } from "sonner"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

import type { Transaction } from "@/types"
import { useProfile } from "@/hooks/use-profile"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

const transactionTypes = ["deposit", "withdrawal", "transfer", "payment", "refund"]

const statusColors: { [key: string]: string } = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
}

const TransactionsPage = () => {
  const supabase = useSupabaseClient()
  const user = useUser()
  const { profile } = useProfile()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  const fetchTransactions = useCallback(
    async (page = 0, filters = {}) => {
      if (!user?.id || !profile?.account_number) return

      try {
        setIsLoading(true)

        // Calculate pagination
        const from = page * pageSize
        const to = from + pageSize - 1

        // Build query with only necessary fields
        let query = supabase
          .from("transactions")
          .select(
            `
        id, 
        amount, 
        created_at, 
        transaction_type, 
        reference, 
        status,
        sender_name, 
        sender_account_number, 
        recipient_name, 
        recipient_account_number
      `,
          )
          .or(
            `sender_account_number.eq.${profile.account_number},recipient_account_number.eq.${profile.account_number}`,
          )
          .order("created_at", { ascending: false })
          .range(from, to)

        // Apply filters
        if (filters.type && filters.type !== "all") {
          query = query.eq("transaction_type", filters.type)
        }

        if (filters.dateRange) {
          const [startDate, endDate] = filters.dateRange
          if (startDate) {
            query = query.gte("created_at", startDate.toISOString())
          }
          if (endDate) {
            query = query.lte("created_at", endDate.toISOString())
          }
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching transactions:", error)
          toast({
            title: "Error",
            description: "Failed to load transactions. Please try again.",
            variant: "destructive",
          })
          return
        }

        if (data) {
          // If loading more (pagination), append to existing transactions
          if (page > 0) {
            setTransactions((prev) => [...prev, ...data])
          } else {
            setTransactions(data)
          }

          // Update hasMore flag based on whether we got a full page of results
          setHasMore(data.length === pageSize)
        }
      } catch (error) {
        console.error("Error in fetchTransactions:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading transactions.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [user?.id, profile?.account_number, pageSize, supabase, toast],
  )

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    setCurrentPage((prev) => prev + 1)
    fetchTransactions(currentPage + 1, {
      type: selectedType,
      dateRange: selectedDateRange,
    })
  }, [fetchTransactions, currentPage, selectedType, selectedDateRange, isLoadingMore, hasMore])

  useEffect(() => {
    if (user?.id && profile?.account_number) {
      setCurrentPage(0)
      fetchTransactions(0, {
        type: selectedType,
        dateRange: selectedDateRange,
      })
    }
  }, [user?.id, profile?.account_number, selectedType, selectedDateRange, fetchTransactions])

  const handleTypeChange = (type: string) => {
    setSelectedType(type)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Transactions</h2>
        <div className="flex items-center space-x-2">
          <div>
            <select
              className="border rounded px-4 py-2"
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              <option value="all">All Types</option>
              {transactionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !selectedDateRange?.from && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDateRange?.from ? (
                  selectedDateRange.to ? (
                    <>
                      {format(selectedDateRange.from, "LLL dd, y")} - {format(selectedDateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(selectedDateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                defaultMonth={selectedDateRange?.from}
                selected={selectedDateRange}
                onSelect={setSelectedDateRange}
                numberOfMonths={2}
                pagedNavigation
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <Table>
          <TableCaption>A list of your recent transactions.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          {isLoading && transactions.length === 0 ? (
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="p-3 sm:p-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="p-3 sm:p-4">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="p-3 sm:p-4">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="p-3 sm:p-4">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="p-3 sm:p-4">
                    <Skeleton className="h-4 w-16" />
                  </td>
                </tr>
              ))}
            </tbody>
          ) : (
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.transaction_type}</TableCell>
                  <TableCell>{transaction.amount}</TableCell>
                  <TableCell>{format(new Date(transaction.created_at), "MMM dd, yyyy")}</TableCell>
                  <TableCell>{transaction.reference}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[transaction.status]}>{transaction.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5}>{/* Pagination will go here */}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
        {hasMore && (
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
              {isLoadingMore ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

import { CalendarIcon } from "@radix-ui/react-icons"

export default TransactionsPage
