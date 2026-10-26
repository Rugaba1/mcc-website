# Contact email retries on cPanel

Contact form submissions are saved together with separate queue entries for the
customer confirmation and team notification. The app tries each email
immediately; failed attempts are retried by the scheduled cPanel request.
Delivery attempts and retry schedules are stored in MySQL, so app restarts do
not discard them.

## Configure the app

1. Set `CONTACT_EMAIL_CRON_SECRET` in the cPanel Node.js application's
   environment variables. Generate a unique value on the server with
   `openssl rand -hex 32`. Do not reuse an SMTP password or commit this value.
2. Apply the database migration during deployment with `npx prisma migrate
   deploy`, then restart the Node.js application.
3. Confirm the site is reachable over HTTPS.

## Add the cPanel Cron Job

Create a private curl config file outside the public document root, for example
`/home/CPANEL_USER/.contact-email-cron.conf`, containing:

```text
header = "Authorization: Bearer REPLACE_WITH_CONTACT_EMAIL_CRON_SECRET"
```

Restrict the file to the cPanel account (`chmod 600
/home/CPANEL_USER/.contact-email-cron.conf`). In **cPanel → Advanced → Cron
Jobs**, schedule this command every five minutes:

```sh
curl --silent --show-error --fail --config /home/CPANEL_USER/.contact-email-cron.conf -X POST https://www.example.com/api/internal/contact-email-queue
```

Replace the account path and domain with the real values. Keep the config file
outside `public_html`; do not put the secret in the URL or a public file.

Each run processes up to 20 due emails. Failed deliveries retry with increasing
delays, up to eight automatic attempts before requiring a staff retry. The
attempt count includes manual retries. Permanently failed emails appear in the
admin Messages detail with a retry action for staff with `messages.manage`.
SMTP transport failures must still be corrected in the cPanel app environment;
the queue preserves and retries messages but cannot make invalid credentials or
provider restrictions succeed.
