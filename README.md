# UTC Converter

A lightweight Chrome extension that converts UTC timestamps to your local timezone — no copy-pasting into websites, no mental math.

![UTC Converter logo](logo.png)

---

## Features

- **Instant conversion** — results update as you type
- **Full offset range** — UTC-12 to UTC+14, including half-hour offsets (e.g. India +5:30)
- **Flexible time input** — accepts `H:MM`, `HH:MM`, `H:MM:SS`, and `HH:MM:SS`
- **Optional date picker** — leave it blank to use the current date in the chosen offset zone, or pick a specific date
- **Quick Reference panel** — searchable list of 27 pre-loaded timezones (Japan, UK, India, NYC, LA, and more) with DST notes; click any entry to auto-fill the offset
- **DST awareness** — footer shows your local timezone name and whether DST is currently active
- **Zero dependencies** — pure vanilla JavaScript, no tracking, no network calls

---

## Installation

This extension is not yet on the Chrome Web Store. Load it manually in a few steps:

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the project folder

The UTC Converter icon will appear in your Chrome toolbar.

---

## Usage

1. Click the extension icon to open the popup
2. Select a **UTC offset** from the dropdown (e.g. `UTC+9` for Japan)
3. Enter a **24-hour time** (e.g. `14:30`)
4. Optionally pick a **date** — useful when the conversion crosses midnight
5. Your **local time** is shown instantly with the full date, day of week, and timezone abbreviation

To use the Quick Reference panel, click the `☰` button in the top-right of the popup, search for a timezone by name or abbreviation, and click an entry to apply its offset.

---

## File Structure

```
utc-to-local-extension/
├── manifest.json   # Chrome extension config (Manifest V3)
├── popup.html      # Extension popup UI
├── popup.js        # Conversion logic, DOM wiring, timezone reference data
├── popup.css       # Styles
├── icons/
│   └── icon128.png
└── logo.png
```

---

## Browser Support

Chrome (Manifest V3). May work in other Chromium-based browsers (Edge, Brave) but has not been tested.

---

## License

MIT
