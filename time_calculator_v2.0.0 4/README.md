# Time Calculator

A clean, modular web-based time calculator that supports addition and subtraction of times in multiple formats.

## Features

- ✅ Add and subtract times
- ✅ Support for HH:MM:SS and HH:MM formats
- ✅ Real-time validation
- ✅ Handles negative results
- ✅ Responsive design
- ✅ Clean, maintainable code structure

## Quick Start

1. Open `index.html` in any modern web browser
2. Select your preferred time format (HH:MM:SS or HH:MM)
3. Enter two times
4. Choose operation (Add or Subtract)
5. Click Calculate

## Project Structure

```
time-calculator/
├── index.html      # Main HTML structure
├── styles.css      # Styling and responsive design
├── script.js       # Time calculation logic
└── README.md       # Documentation
```

## Code Architecture

### script.js Structure

The JavaScript code is organized into clear sections for easy maintenance:

1. **Utility Functions** - Core time conversion and validation
   - `timeToSeconds()` - Convert time string to seconds
   - `secondsToTime()` - Convert seconds back to time string
   - `validateTimeFormat()` - Validate time input
   - `pad()` - Helper for zero-padding

2. **Calculation Functions** - Business logic
   - `addTimes()` - Add two times
   - `subtractTimes()` - Subtract two times

3. **UI Management** - Interface handling
   - `showResult()` - Display calculation result
   - `showError()` - Display validation errors
   - `updatePlaceholders()` - Update UI for format changes

4. **Main Handler** - Orchestration
   - `handleCalculate()` - Coordinates the calculation process

5. **Event Listeners** - User interactions

### Key Design Principles

- **Separation of Concerns**: Logic, UI, and validation are separated
- **Pure Functions**: Core functions have no side effects
- **Easy Testing**: Each function can be tested independently
- **Clear Comments**: Every function is documented
- **Error Handling**: Comprehensive validation with user-friendly messages

## Modification Guide

### Adding a New Time Format

1. Update format selector in `index.html`
2. Add validation logic in `validateTimeFormat()`
3. Update conversion logic in `timeToSeconds()` and `secondsToTime()`
4. Add placeholder text in `updatePlaceholders()`

### Adding a New Operation

1. Add radio button in `index.html` (operation-selector section)
2. Create new function in "Calculation Functions" section of `script.js`
3. Add case in `handleCalculate()` function

### Changing Styles

All visual styling is in `styles.css`. Key sections:
- `.calculator-card` - Main container styling
- `.operation-btn` - Operation button styles
- `.result` - Result display styling
- Media queries at bottom for mobile responsiveness

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancement Ideas

- [ ] Save calculation history
- [ ] Support for time duration display (e.g., "2 hours, 30 minutes")
- [ ] Multiple time zones
- [ ] Export results
- [ ] Keyboard shortcuts
- [ ] Dark mode

## Developer Notes

- No external dependencies required
- Pure vanilla JavaScript - easy to understand and modify
- All calculations use seconds as base unit for accuracy
- Negative results are supported and properly displayed
- Input validation prevents invalid calculations

## Time to Understand

A new developer should be able to:
- **Understand the structure**: 15-30 minutes
- **Make simple changes**: 30-60 minutes
- **Add new features**: 1-2 hours

The code is designed to be self-documenting with clear function names and comprehensive comments.
