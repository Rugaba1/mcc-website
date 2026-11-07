# Contact email retries on cPanel

Contact form submissions are saved together with separate queue entries for the
customer confirmation and team notification. The app tries each email
immediately; failed attempts are retried by the scheduled cPanel request.
Delivery attempts and retry schedules are stored in MySQL, so app restarts do
not discard them.

## Configure the app

1. Set `CONTACT_EMAIL_CRON_SECRET` in the cPanel Node.js application's
   environment variables. Generate a unique value on the server with
   `openssl rand -hex 32`. Use the same value in the private curl config below.
   Do not reuse a Resend API key or commit this value.
2. Set `RESEND_API_KEY` and `EMAIL_FROM`. The sender domain must be verified in
   Resend and have its SPF, DKIM, and DMARC records configured.
3. Apply the database migration during deployment with `npx prisma migrate
   deploy`, then restart the Node.js application.
4. Confirm the site is reachable over HTTPS.

## Add the cPanel Cron Job

Create a private curl config file outside the public document root, for example
`/home/CPANEL_USER/.contact-email-cron.conf`, containing the generated secret:

```text
header = "Authorization: Bearer YOUR_GENERATED_SECRET"
```

Restrict the file to the cPanel account (`chmod 600
/home/CPANEL_USER/.contact-email-cron.conf`). In **cPanel → Advanced → Cron
Jobs**, add the following command and set the schedule to every five minutes
(`*/5 * * * *`):

```sh
curl --silent --show-error --fail --config /home/CPANEL_USER/.contact-email-cron.conf -X POST https://www.example.com/api/internal/contact-email-queue
```

Replace the account path, secret, and domain with the real values. Keep the
config file outside `public_html`; do not put the secret in the cron command,
URL, or a public file. After saving the cron job, run the command once manually
from the cPanel terminal to verify it returns JSON successfully. An HTTP 401
means the bearer secret does not match; HTTP 503 means the app environment
secret is missing or shorter than 32 characters.

Each run processes up to 20 due emails. Failed deliveries retry with increasing
delays, up to eight automatic attempts before requiring a staff retry. The
attempt count includes manual retries. Permanently failed emails appear in the
admin Messages detail with a retry action for staff with `messages.manage`.
Resend API key, verified sender, or provider errors must be corrected in the
cPanel app environment; the queue preserves and retries messages but cannot
override invalid credentials or provider restrictions.
