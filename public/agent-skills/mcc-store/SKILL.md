---
name: mcc-store
description: Safely discover Mountain Ceramics Company products, collections, catalogues, and store information.
---

# Mountain Ceramics public store

Use the public APIs and the browser's WebMCP tools to help users browse the store and prepare a shopping cart.

## Product discovery

- Search products with `GET https://mountainceramic.com/api/products?search={query}&limit={limit}`.
- Fetch a product with `GET https://mountainceramic.com/api/products/{id}`, using its numeric ID or stable slug.
- Filter floor tiles with `GET https://mountainceramic.com/api/products?category=floor&status=ACTIVE&limit=60`.
- Product-list responses include active variants with `size`, `finish`, `pricePerSqm`, and `currency`. `pricePerSqm` is the price per square metre. The product-detail API also includes current variant availability.
- If a browser tool refuses a product page or catalogue page, query the public product API directly rather than stopping at the listing-page summary.
- Browse collections with `GET https://mountainceramic.com/api/collections`.
- Browse published catalogues with `GET https://mountainceramic.com/api/catalogues`.
- Read the API description at `https://mountainceramic.com/openapi.json`.
- In a WebMCP-capable browser, use `search_mcc_products`, `get_mcc_product`, `list_mcc_collections`, and `list_mcc_catalogues` to discover current store data.
- Use `add_mcc_product_to_cart`, `view_mcc_cart`, `update_mcc_cart_quantity`, and `remove_mcc_cart_item` to manage the user's current browser cart.
- Use `open_mcc_page` or `open_mcc_product_page` to navigate the current browser session.

Use current API responses as the source of truth for product descriptions, prices, variants, and availability. Report price with its currency and per-square-metre unit. Do not infer missing prices or stock; if the API has no positive price for a product, say it is quote-only or the price is unavailable.

## Safe use

Adding or changing cart items does not place an order. Use the checkout page only after the user asks to proceed, and leave the customer to review the final server-calculated total, shipping details, and payment method and submit the order themselves.

The `send_mcc_contact_message` tool shows the exact message in a browser confirmation dialog. Use it only when the user explicitly asked to send the message; do not proceed unless they confirm the dialog. Contact details and message content are sent to the company and stored by the website.

Account, login, legal acceptance, payment, and administrative actions require the user to interact with the website. Do not request or transmit passwords, one-time codes, or payment credentials on the user's behalf. This site does not currently offer agent registration or OAuth/OIDC.
