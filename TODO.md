# TODO (Client Orders Page Fix)

## Step 1: Understand why orders not showing
- Read `client/src/pages/orders.tsx`
- Confirm backend route `/api/profile/orders` response shape
- Identify likely failure cause (auth/token mismatch vs empty DB)

## Step 2: Verify auth/token mechanism
- Read `server/auth.ts` to confirm `protectUserRoute` behavior and token source

## Step 3: Implement UI fix + debugging
- Update `client/src/pages/orders.tsx` to:
  - Redirect to `/login` if token missing
  - Show an error message when fetch fails (instead of silent empty state)
  - Log HTTP status/body for diagnosis

## Step 4: Validate
- Run client build/dev and test `/orders` page
- Confirm orders appear when user has orders

