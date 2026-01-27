# Row Level Security (RLS) Policies

This document outlines the RLS policies implemented across all tables in Alghahim Virtual Bank.

## Overview

RLS ensures that users can only access data that belongs to them. All policies use `auth.uid()` to get the current authenticated user's ID.

## Tables with RLS Enabled

### 1. **transactions** ✅
- Users can view transactions where they are the sender, recipient, or user_id matches
- Users can only insert transactions as themselves
- Users can only update transactions they created
- Filters: `user_id = auth.uid()` or account number relationships

### 2. **user_profiles** ✅
- Users can only view, insert, and update their own profile
- Filters: `user_id = auth.uid()`

### 3. **users** ✅
- Users can view their own user data
- Users can update their own user data
- Admins can view all users
- Filters: `id = auth.uid()` or admin role

### 4. **card_details** ✅
- Users can view their own card details
- Users can insert, update, and delete their own card details
- Filters: `account_no` matched to user's account

### 5. **kyc_submissions** ✅
- Users can view their own KYC submissions
- Users can insert their own KYC submissions
- Filters: `user_id = auth.uid()`

### 6. **notifications** ✅
- Users can view notifications meant for them
- Users can update and delete their own notifications
- Filters: `user_id = auth.uid()` or `account_no` match

### 7. **savings_accounts** ✅
- Users can view only their savings accounts
- Users can insert, update, and delete their savings accounts
- Filters: `account_no` matched to user's account

### 8. **savings_transactions** ✅
- Users can view their savings transactions
- Users can insert their savings transactions
- Filters: `account_no` matched to user's account

### 9. **support_tickets** ✅
- Users can view their support tickets
- Users can insert and update their support tickets
- Filters: `account_no` matched to user's account

### 10. **bank_accounts** ✅
- Users can view only their bank accounts
- Users can insert, update, and delete their bank accounts
- Filters: `account_no` matched to user's account

### 11. **loan_applications** ✅
- Users can view their own loan applications
- Users can insert and update their loan applications
- Filters: `user_id = auth.uid()`

### 12. **loan_repayments** ✅
- Users can view repayments for their loans
- Filters: Loan application's user_id must match auth.uid()

### 13. **referrals** ✅
- Users can view referrals where they are the referrer or referred
- Filters: `account_no` matched to user's account (both directions)

### 14. **app_settings** ✅
- Authenticated users can view settings
- Only admins can modify settings
- Filters: Role-based access

## Dashboard Recent Transactions

The dashboard already implements client-side filtering:
```typescript
// Get recent transactions - only user's transactions
const { data: transactions } = await supabase
  .from("transactions")
  .select("*")
  .eq("user_id", user.id)  // Filter by user_id
  .order("created_at", { ascending: false })
  .limit(10)
```

With RLS policies now in place, even if someone tries to bypass client-side filtering, the database will enforce that they can only see their own transactions.

## Security Best Practices

1. **Never bypass RLS** - Always ensure RLS is enabled on sensitive tables
2. **Test RLS policies** - Verify policies work as expected before deploying
3. **Use service role carefully** - Service role key bypasses RLS; only use for admin operations
4. **Monitor policies** - Regularly audit and update policies as requirements change
5. **Principle of least privilege** - Users should only access what they need

## Testing RLS Policies

To test if RLS is working:

1. Log in as User A
2. Fetch a transaction - should only see User A's transactions
3. Log in as User B
4. Try to fetch User A's transactions - should get empty result
5. Fetch User B's transactions - should only see User B's transactions

## Performance Considerations

RLS policies with subqueries may impact performance on large datasets. Consider:
- Indexing account_no and user_id columns
- Using `account_no` directly when possible instead of subqueries
- Monitoring slow queries in Supabase logs
