# Cadet Measurement Card Generator

A lightweight, frontend-only web application for entering cadet shirt/pant measurements and generating printable A4 measurement cards.

## How to use

1. Enter `নাম` and `ক্যাডেট নম্বর`.
2. Enter any available shirt and pant measurements.
3. Click `মাপ যোগ করুন`.
4. Repeat for as many cadets as needed.
5. Select `9 Cards` or `12 Cards` per page.
6. Click `প্রিন্ট / PDF`.
7. In the browser print dialog, choose `Save as PDF`.

## Print recommendations

For the cleanest physical/PDF result:

- Paper: **A4**
- Orientation: **Portrait**
- Scale: **100% / Actual size** when the browser offers that option
- Browser headers/footers: **Off**
- The app already defines `@page { size: A4 portrait; margin: 0; }`

## Data storage

Cadet records are stored only in the browser's `localStorage` under:

```text
cadet_measurements_v1
```

The application does not send measurement data to a server.

Use `ডাটা এক্সপোর্ট` to create a `cadet-measurements.json` backup. Use `ডাটা ইমপোর্ট` to restore or merge records later.

## Tiro Bangla

The UI uses a Bengali-friendly system font stack headed by `Tiro Bangla` and falls back to installed Bengali-capable fonts such as `Nirmala UI`, `Vrinda`, and `SolaimanLipi`, followed by generic system fonts. This keeps the project self-contained without bundling a font file or requiring a font API.
