# qrgen (bundled)

Rust binary that produces SVG QR codes. Vendored into this project so you
don't depend on a global install.

## Build it once

```sh
cargo build --release --manifest-path qrgen/crate/Cargo.toml
```

Or use the `npm run qr` shortcut, which builds on first use.

## Use it

```sh
npm run qr -- "https://your-talk.example" > static/qr.svg
```

Flags (after `--`):

- `--dark=#hex` — foreground (default tuned to the deck palette)
- `--light=#hex` — background (default tuned to the deck palette)
- `--size=<px>` — minimum size in px (default 256)
- `--ec=L|M|Q|H` — error correction (default M; use H if printing small)

## When to use this vs the runtime QR

The runtime `<QrCode />` component renders QR on every slide using the
`qrcode` npm package. That's good for the live deck.

Use `qrgen` when you want a *static* SVG to:

- bake into a poster or handout
- inline into a Markdown blog post
- ship in `static/` so the QR is identical across deploys

You'll typically run it once before the talk and forget about it.
