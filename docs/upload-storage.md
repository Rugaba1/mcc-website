# Uploaded media storage

Uploads keep their existing public URL format, such as
`/uploads/images/<uuid>.jpg`. The app serves those URLs through a runtime route
and stores new files outside the Next.js build output.

## Configure production storage

Set `UPLOAD_STORAGE_DIR` in the app's production environment to an absolute,
writable, persistent directory outside the public web root. For example:

```text
/home/CPANEL_USER/private/mcc/uploads
```

Create the directory and make it writable by the Node.js app user. If the
deployment runs on multiple app instances, use storage shared by all of them.
Restart the app after setting the variable.

The app reads existing files from `public/uploads` as a compatibility fallback.
To preserve those files through a deployment, copy the existing `images` and
`files` directories into the configured directory, keeping the filenames:

```text
UPLOAD_STORAGE_DIR/
  images/
  files/
```

Do not serve the configured storage directory directly from the web server.
Requests should reach the Next.js `/uploads/...` route.

Uploaded images are served directly instead of through the Next.js image
optimizer, so an optimizer's cached failed fetch cannot delay a new upload.
Missing-file responses are marked `no-store`. If a CDN cached an older 404
before this change was deployed, purge that cached URL once. If files still
appear inconsistently, verify that every app instance uses the same
`UPLOAD_STORAGE_DIR` mount; a local container filesystem is not shared storage.
