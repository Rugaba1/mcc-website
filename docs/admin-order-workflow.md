# Admin order workflow

The Orders page provides one order-creation flow for account customers, saved
walk-in contacts, and new walk-in customers. A walk-in is saved as a contact,
not as a user account, and can be selected again for a later order.

## Creating and managing orders

1. Open **Admin → Orders → Create order** and select an existing account,
   saved contact, or new walk-in customer.
2. Enter the customer's name and phone. Email and Rwanda TIN are optional.
   Delivery orders require a valid province, district, and street; pickup
   orders do not require a delivery address. Delivery costs 500 in the store's
   base currency per square metre ordered, independent of the delivery location.
3. Add active catalog variants and quantities. Prices come from the current
   catalog, and inventory is reserved transactionally. Staff cannot override
   catalog prices from this form.
4. Optionally record a full or partial payment with its method and received
   time. The order can also be created unpaid; additional payments can be
   recorded from the order detail page.
5. The order detail page shows its invoice/proforma, payments, outstanding
   balance, and status controls. Staff can manually email the invoice from
   this page when the customer has an email address.

Online checkout uses the same per-square-metre delivery rate. Pickup is free.

Account customers and walk-in contacts use the same flow. Account customer
orders remain linked to the account; walk-in orders preserve customer contact
and address snapshots and link to a reusable saved contact.

## Permissions

- `orders.manage`: create orders and load the customer/catalog options.
- `payments.record`: required when creating an order with an initial payment
  and for recording subsequent payments.
- `invoices.issue`: required to send an invoice email.
- Existing order-view and order-status permissions continue to govern viewing
  and updating the order.

## Deployment

Apply the `add_saved_walkin_customers` migration before deploying code that
queries saved contacts. In production, deploy migrations with:

```bash
npx prisma migrate deploy
```

Do not use `prisma migrate reset` on production data. The migration links
eligible historical guest orders to saved contacts using their email, or their
phone when email is absent. Guest orders without a usable phone remain
unlinked.

Invoice email delivery uses the existing Resend integration. Configure
`RESEND_API_KEY`, a verified `EMAIL_FROM` sender, and the public canonical
`NEXT_PUBLIC_SITE_URL`. Also set `INVOICE_URL_SECRET` to a unique random
secret of at least 32 characters; it signs invoice links that expire after
seven days. Keep this secret private and consistent across application
instances. Email delivery is manual; creating an order does not email the
invoice automatically.
