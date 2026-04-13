# Phase 5 Manual Testing Checklist

## Sales Creation
- [ ] Create sale with single item
- [ ] Create sale with multiple items
- [ ] Create sale with discount
- [ ] Create sale with customer
- [ ] Test idempotency (submit same sale twice)
- [ ] Test insufficient stock error
- [ ] Test insufficient payment error
- [ ] Verify inventory deduction
- [ ] Verify shift totals updated
- [ ] Verify customer loyalty points added

## Sale Retrieval
- [ ] Get sale by ID
- [ ] List all sales
- [ ] Filter sales by date range
- [ ] Filter sales by branch
- [ ] Filter sales by customer
- [ ] Filter sales by status
- [ ] Test pagination

## Void Sale
- [ ] Void a sale
- [ ] Verify inventory restored
- [ ] Verify shift totals adjusted
- [ ] Test void permission (only manager/admin)
- [ ] Test cannot void old sales
- [ ] Test cannot void already voided sale

## Shifts
- [ ] Open new shift
- [ ] Test cannot open multiple shifts per user
- [ ] Make sales during shift
- [ ] Close shift with cash reconciliation
- [ ] Verify cash difference calculation
- [ ] Get shift summary
- [ ] Test cannot close someone else's shift
- [ ] Verify shift sales totals

## Receipts
- [ ] Generate receipt JSON
- [ ] Generate text receipt
- [ ] Verify all items appear correctly
- [ ] Verify totals calculation
- [ ] Test receipt with customer info
- [ ] Test receipt without customer

## Edge Cases
- [ ] Concurrent sale attempts (race condition)
- [ ] Zero-priced items
- [ ] Very large quantities
- [ ] Multiple discount types
- [ ] Network timeout during transaction
- [ ] Database connection loss

## Performance
- [ ] 10+ concurrent sales
- [ ] Response time < 2 seconds
- [ ] No memory leaks
- [ ] Database connection pooling works

## Data Integrity
- [ ] Sale totals match item totals
- [ ] Inventory movements recorded
- [ ] Shift totals accurate
- [ ] Customer loyalty points correct
- [ ] No orphaned records
