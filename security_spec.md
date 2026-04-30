# Security Specification - GlixBD

## Data Invariants
1. A user profile cannot be created by anyone other than the user themselves or an admin.
2. An order must belong to a user (or 'guest') and must contain a total amount and items.
3. A review must be linked to a valid product ID and an authenticated user.
4. Notifications are private to the user unless viewed by an admin.
5. Only admins can modify products, categories, settings, banners, and coupons.
6. Users cannot modify their own `walletBalance` or `points` directly.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing**: User A trying to create a profile for User B.
2. **Privilege Escalation**: User A trying to set `isBlocked: false` or `walletBalance: 1000000` on their own profile.
3. **Data Poisoning**: Creating a review with a 1MB string or an invalid product ID.
4. **Relational Breakage**: Creating a review for a product that doesn't exist (if enforced).
5. **State Shortcutting**: Updating an order status directly from 'pending' to 'delivered' by a non-admin.
6. **Shadow Fields**: Adding `isVerified: true` to a user profile during creation.
7. **Orphaned Writes**: Creating a notification for a user that doesn't exist.
8. **Denial of Wallet**: Sending 10,000 likes to a review in a loop with massive IDs.
9. **Query Scraping**: Listing all users without being an admin.
10. **Immutable Field Change**: Changing the `userId` of an existing order.
11. **PII Leak**: A guest user trying to get another user's private address.
12. **System Bypass**: Modifying `reviewCount` or `rating` on a product without actually submitting a review (though rules allow `likesCount` increments).

## Test Runner Plan
- Verify `create` on `/users/{id}` strictly matches `request.auth.uid`.
- Verify `update` on `/users/{id}` prevents `walletBalance` change.
- Verify `create` on `/reviews` requires `isValidId` for `productId`.
- Verify `list` on `/users` is restricted to `isAdmin()`.
