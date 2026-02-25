/**
 * Time Calculator Application
 * Supports addition and subtraction of times in HH:MM:SS and HH:MM formats
 */

// ============================================================================
// UTILITY FUNCTIONS - Core time conversion and validation logic
// ============================================================================

/**
 * Convert time string to total seconds
 * @param {string} timeStr - Time string in HH:MM:SS or HH:MM format
 * @param {string} format - Expected format ('HHMMSS' or 'HHMM')
 * @returns {number} Total seconds
 */
function timeToSeconds(timeStr, format) {
    const parts = timeStr.split(':').map(part => parseInt(part, 10));
    
    if (format === 'HHMMSS') {
        const [hours, minutes, seconds] = parts;
        return hours * 3600 + minutes * 60 + seconds;
    } else {
        const [hours, minutes] = parts;
        return hours * 3600 + minutes * 60;
    }
}

/**
 * Convert seconds to time string
 * @param {number} totalSeconds - Total seconds (can be negative)
 * @param {string} format - Output format ('HHMMSS' or 'HHMM')
 * @returns {string} Formatted time string
 */
function secondsToTime(totalSeconds, format) {
    const isNegative = totalSeconds < 0;
    const absSeconds = Math.abs(totalSeconds);
    
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const seconds = absSeconds % 60;
    
    const sign = isNegative ? '-' : '';
    
    if (format === 'HHMMSS') {
        return `${sign}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    } else {
        return `${sign}${pad(hours)}:${pad(minutes)}`;
    }
}

/**
 * Pad number with leading zero
 * @param {number} num - Number to pad
 * @returns {string} Padded string
 */
function pad(num) {
    return num.toString().padStart(2, '0');
}

/**
 * Validate time string format
 * @param {string} timeStr - Time string to validate
 * @param {string} format - Expected format ('HHMMSS' or 'HHMM')
 * @returns {object} Validation result with isValid and error properties
 */
function validateTimeFormat(timeStr, format) {
    if (!timeStr || timeStr.trim() === '') {
        return { isValid: false, error: 'Time cannot be empty' };
    }

    const parts = timeStr.split(':');
    
    if (format === 'HHMMSS') {
        if (parts.length !== 3) {
            return { isValid: false, error: 'Time must be in HH:MM:SS format' };
        }
    } else {
        if (parts.length !== 2) {
            return { isValid: false, error: 'Time must be in HH:MM format' };
        }
    }

    // Validate each part is a number
    for (let part of parts) {
        if (!/^\d+$/.test(part)) {
            return { isValid: false, error: 'Time must contain only numbers' };
        }
    }

    const numbers = parts.map(p => parseInt(p, 10));
    
    if (format === 'HHMMSS') {
        const [hours, minutes, seconds] = numbers;
        if (minutes >= 60) {
            return { isValid: false, error: 'Minutes must be less than 60' };
        }
        if (seconds >= 60) {
            return { isValid: false, error: 'Seconds must be less than 60' };
        }
    } else {
        const [hours, minutes] = numbers;
        if (minutes >= 60) {
            return { isValid: false, error: 'Minutes must be less than 60' };
        }
    }

    return { isValid: true };
}

// ============================================================================
// CALCULATION FUNCTIONS - Business logic for time operations
// ============================================================================

/**
 * Add two times
 * @param {string} time1 - First time string
 * @param {string} time2 - Second time string
 * @param {string} format - Time format
 * @returns {string} Result time string
 */
function addTimes(time1, time2, format) {
    const seconds1 = timeToSeconds(time1, format);
    const seconds2 = timeToSeconds(time2, format);
    const totalSeconds = seconds1 + seconds2;
    return secondsToTime(totalSeconds, format);
}

/**
 * Subtract two times
 * @param {string} time1 - First time string
 * @param {string} time2 - Second time string (subtracted from time1)
 * @param {string} format - Time format
 * @returns {string} Result time string
 */
function subtractTimes(time1, time2, format) {
    const seconds1 = timeToSeconds(time1, format);
    const seconds2 = timeToSeconds(time2, format);
    const totalSeconds = seconds1 - seconds2;
    return secondsToTime(totalSeconds, format);
}

// ============================================================================
// UI MANAGEMENT - Handle user interface updates and interactions
// ============================================================================

/**
 * Show result in UI
 * @param {string} result - Result to display
 */
function showResult(result) {
    const resultDiv = document.getElementById('result');
    const resultValue = resultDiv.querySelector('.result-value');
    const errorDiv = document.getElementById('error');
    
    errorDiv.classList.add('hidden');
    resultDiv.classList.remove('hidden');
    resultValue.textContent = result;
}

/**
 * Show error in UI
 * @param {string} errorMessage - Error message to display
 */
function showError(errorMessage) {
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    
    resultDiv.classList.add('hidden');
    errorDiv.classList.remove('hidden');
    errorDiv.textContent = '⚠️ ' + errorMessage;
}

/**
 * Update placeholders based on selected format
 * @param {string} format - Selected format
 */
function updatePlaceholders(format) {
    const time1Input = document.getElementById('time1');
    const time2Input = document.getElementById('time2');
    const hints = document.querySelectorAll('.hint');
    
    if (format === 'HHMMSS') {
        time1Input.placeholder = '00:00:00';
        time2Input.placeholder = '00:00:00';
        time1Input.maxLength = 8;
        time2Input.maxLength = 8;
        hints[0].textContent = 'Example: 10:30:45';
        hints[1].textContent = 'Example: 05:15:30';
    } else {
        time1Input.placeholder = '00:00';
        time2Input.placeholder = '00:00';
        time1Input.maxLength = 5;
        time2Input.maxLength = 5;
        hints[0].textContent = 'Example: 10:30';
        hints[1].textContent = 'Example: 05:15';
    }
}

// ============================================================================
// MAIN CALCULATION HANDLER - Orchestrates the calculation process
// ============================================================================

/**
 * Handle calculate button click
 */
function handleCalculate() {
    // Get input values
    const time1 = document.getElementById('time1').value.trim();
    const time2 = document.getElementById('time2').value.trim();
    const format = document.querySelector('input[name="format"]:checked').value;
    const operation = document.querySelector('input[name="operation"]:checked').value;

    // Validate inputs
    const validation1 = validateTimeFormat(time1, format);
    if (!validation1.isValid) {
        showError(`Time 1: ${validation1.error}`);
        return;
    }

    const validation2 = validateTimeFormat(time2, format);
    if (!validation2.isValid) {
        showError(`Time 2: ${validation2.error}`);
        return;
    }

    // Perform calculation
    try {
        let result;
        if (operation === 'add') {
            result = addTimes(time1, time2, format);
        } else {
            result = subtractTimes(time1, time2, format);
        }
        showResult(result);
    } catch (error) {
        showError('An error occurred during calculation');
        console.error(error);
    }
}

// ============================================================================
// ARRIVAL TIME CALCULATOR - Smart calculator for departure/duration/arrival
// ============================================================================

/**
 * Handle arrival time calculation
 * Calculates the missing value when any 2 of 3 fields are filled
 */
function handleArrivalCalculate() {
    const departure = document.getElementById('departureTime').value.trim();
    const duration = document.getElementById('duration').value.trim();
    const arrival = document.getElementById('arrivalTime').value.trim();
    const format = document.querySelector('input[name="format"]:checked').value;

    // Count filled fields
    const filledFields = [departure, duration, arrival].filter(v => v !== '').length;

    if (filledFields < 2) {
        showArrivalError('Please fill at least 2 fields');
        return;
    }

    if (filledFields === 3) {
        showArrivalError('Please leave one field empty to calculate');
        return;
    }

    try {
        let result = '';
        let resultLabel = '';

        // Case 1: Calculate Arrival Time (Departure + Duration)
        if (departure && duration && !arrival) {
            const validation1 = validateTimeFormat(departure, format);
            if (!validation1.isValid) {
                showArrivalError(`Departure Time: ${validation1.error}`);
                return;
            }

            const validation2 = validateTimeFormat(duration, format);
            if (!validation2.isValid) {
                showArrivalError(`Duration: ${validation2.error}`);
                return;
            }

            const arrivalTime = addTimes(departure, duration, format);
            document.getElementById('arrivalTime').value = arrivalTime;
            result = `<strong>Arrival Time:</strong> ${arrivalTime}`;
            resultLabel = 'Calculated arrival time';
        }
        // Case 2: Calculate Duration (Arrival - Departure)
        else if (departure && arrival && !duration) {
            const validation1 = validateTimeFormat(departure, format);
            if (!validation1.isValid) {
                showArrivalError(`Departure Time: ${validation1.error}`);
                return;
            }

            const validation2 = validateTimeFormat(arrival, format);
            if (!validation2.isValid) {
                showArrivalError(`Arrival Time: ${validation2.error}`);
                return;
            }

            const durationTime = subtractTimes(arrival, departure, format);
            document.getElementById('duration').value = durationTime;
            result = `<strong>Duration:</strong> ${durationTime}`;
            resultLabel = 'Calculated travel duration';
        }
        // Case 3: Calculate Departure Time (Arrival - Duration)
        else if (arrival && duration && !departure) {
            const validation1 = validateTimeFormat(arrival, format);
            if (!validation1.isValid) {
                showArrivalError(`Arrival Time: ${validation1.error}`);
                return;
            }

            const validation2 = validateTimeFormat(duration, format);
            if (!validation2.isValid) {
                showArrivalError(`Duration: ${validation2.error}`);
                return;
            }

            const departureTime = subtractTimes(arrival, duration, format);
            document.getElementById('departureTime').value = departureTime;
            result = `<strong>Departure Time:</strong> ${departureTime}`;
            resultLabel = 'Calculated departure time';
        }

        showArrivalResult(result);
    } catch (error) {
        showArrivalError('An error occurred during calculation');
        console.error(error);
    }
}

/**
 * Show result in Arrival Time Calculator
 * @param {string} result - Result HTML to display
 */
function showArrivalResult(result) {
    const resultDiv = document.getElementById('arrivalResult');
    const resultDetail = resultDiv.querySelector('.result-detail');
    const errorDiv = document.getElementById('arrivalError');
    
    errorDiv.classList.add('hidden');
    resultDiv.classList.remove('hidden');
    resultDetail.innerHTML = result;
}

/**
 * Show error in Arrival Time Calculator
 * @param {string} errorMessage - Error message to display
 */
function showArrivalError(errorMessage) {
    const resultDiv = document.getElementById('arrivalResult');
    const errorDiv = document.getElementById('arrivalError');
    
    resultDiv.classList.add('hidden');
    errorDiv.classList.remove('hidden');
    errorDiv.textContent = '⚠️ ' + errorMessage;
}

// ============================================================================
// 9-HOUR SHIFT CALCULATOR - Calculate departure time from arrival time
// ============================================================================

// Store departure time globally for use in other calculators
let storedDepartureTime = null;

/**
 * Handle shift time calculation
 * Calculates departure time as arrival time + 9 hours (or 7 hours in Ramadan mode)
 */
function handleShiftCalculate() {
    const arrivalTime = document.getElementById('shiftArrivalTime').value.trim();
    const format = document.querySelector('input[name="format"]:checked').value;

    if (!arrivalTime) {
        showShiftError('Please enter an arrival time');
        return;
    }

    // Validate arrival time
    const validation = validateTimeFormat(arrivalTime, format);
    if (!validation.isValid) {
        showShiftError(`Arrival Time: ${validation.error}`);
        return;
    }

    try {
        // Check if Ramadan mode is enabled
        const ramadanSwitch = document.getElementById('ramadanSwitch');
        const isRamadanMode = ramadanSwitch && ramadanSwitch.checked;
        
        // Use 7 hours in Ramadan mode, 9 hours otherwise
        const hours = isRamadanMode ? 7 : 9;
        const hoursStr = format === 'HHMMSS' ? `0${hours}:00:00` : `0${hours}:00`;
        
        // Calculate departure time (arrival + hours)
        const departureTime = addTimes(arrivalTime, hoursStr, format);
        
        // Store departure time for use in other calculators
        storedDepartureTime = departureTime;
        
        // Store arrival time for auto-elapsed calculation
        storedArrivalTime = arrivalTime;
        
        // Trigger auto-elapsed update if enabled
        updateAutoElapsedTime();
        
        showShiftResult(departureTime, isRamadanMode);
    } catch (error) {
        showShiftError('An error occurred during calculation');
        console.error(error);
    }
}

/**
 * Show result in Shift Calculator
 * @param {string} result - Result to display
 * @param {boolean} isRamadanMode - Whether Ramadan mode is enabled
 */
function showShiftResult(result, isRamadanMode = false) {
    const resultDiv = document.getElementById('shiftResult');
    const resultValue = resultDiv.querySelector('.result-value');
    const shiftNote = resultDiv.querySelector('.shift-note');
    const errorDiv = document.getElementById('shiftError');
    
    errorDiv.classList.add('hidden');
    resultDiv.classList.remove('hidden');
    resultValue.textContent = result;
    
    // Update note based on mode
    const hours = isRamadanMode ? '7 hours' : '9 hours';
    shiftNote.textContent = `Departure is ${hours} after arrival${isRamadanMode ? ' (Ramadan mode)' : ''}`;
}

/**
 * Show error in Shift Calculator
 * @param {string} errorMessage - Error message to display
 */
function showShiftError(errorMessage) {
    const resultDiv = document.getElementById('shiftResult');
    const errorDiv = document.getElementById('shiftError');
    
    resultDiv.classList.add('hidden');
    errorDiv.classList.remove('hidden');
    errorDiv.textContent = '⚠️ ' + errorMessage;
}

// ============================================================================
// REMAINING TIME CALCULATOR - Calculate remaining time from 7 hours
// ============================================================================

/**
 * Get selected UTC offset from the timezone selector
 * @returns {number} UTC offset in hours (e.g., 6 for UTC+6)
 */
function getSelectedUTCOffset() {
    const selector = document.getElementById('utcOffset');
    return selector ? parseFloat(selector.value) : 6;
}

/**
 * Get current time in selected UTC offset timezone
 * @param {string} format - Time format ('HHMMSS' or 'HHMM')
 * @returns {string} Current time in specified format
 */
function getCurrentTimeWithOffset(format) {
    const now = new Date();
    const offsetHours = getSelectedUTCOffset();
    const offsetMs = offsetHours * 60 * 60 * 1000;
    const adjustedTime = new Date(now.getTime() + now.getTimezoneOffset() * 60 * 1000 + offsetMs);
    
    const hours = adjustedTime.getHours();
    const minutes = adjustedTime.getMinutes();
    const seconds = adjustedTime.getSeconds();
    
    if (format === 'HHMMSS') {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    } else {
        return `${pad(hours)}:${pad(minutes)}`;
    }
}

/**
 * Get UTC offset label for display
 * @returns {string} Formatted UTC offset label (e.g., "UTC+06:00")
 */
function getUTCLabel() {
    const offset = getSelectedUTCOffset();
    const sign = offset >= 0 ? '+' : '\u2212';
    const absOffset = Math.abs(offset);
    const h = Math.floor(absOffset);
    const m = Math.round((absOffset - h) * 60);
    return `UTC${sign}${pad(h)}:${pad(m)}`;
}

// Store the arrival time for auto-elapsed calculation
let storedArrivalTime = null;

// Countdown timer interval reference
let countdownInterval = null;

// Store remaining seconds for countdown
let countdownTargetTime = null;

/**
 * Calculate elapsed time automatically from stored arrival time
 * @param {string} format - Time format
 * @returns {string|null} Elapsed time string or null
 */
function calculateAutoElapsed(format) {
    if (!storedArrivalTime) return null;
    
    const currentTime = getCurrentTimeWithOffset(format);
    const currentSec = timeToSeconds(currentTime, format);
    const arrivalSec = timeToSeconds(storedArrivalTime, format);
    
    // If current time is before arrival (shouldn't happen normally), return 00:00
    const elapsed = Math.max(0, currentSec - arrivalSec);
    return secondsToTime(elapsed, format);
}

/**
 * Update the elapsed time input automatically
 */
function updateAutoElapsedTime() {
    const autoSwitch = document.getElementById('autoElapsedSwitch');
    if (!autoSwitch || !autoSwitch.checked) return;
    
    const format = document.querySelector('input[name="format"]:checked').value;
    const elapsed = calculateAutoElapsed(format);
    
    if (elapsed) {
        const elapsedInput = document.getElementById('elapsedTime');
        elapsedInput.value = elapsed;
        elapsedInput.classList.add('auto-filled');
        
        const hint = document.getElementById('elapsedHint');
        if (hint) {
            hint.innerHTML = `Auto-calculated from arrival <span class="auto-elapsed-badge">LIVE</span>`;
        }
    }
}

/**
 * Handle remaining time calculation
 * Calculates remaining time as 7 hours - input time
 * Also calculates final time as current time + remaining time
 * Also calculates free time as departure time - final time
 */
function handleRemainingCalculate() {
    // Auto-update elapsed if enabled
    updateAutoElapsedTime();
    
    const elapsedTime = document.getElementById('elapsedTime').value.trim();
    const format = document.querySelector('input[name="format"]:checked').value;

    if (!elapsedTime) {
        showRemainingError('Please enter an elapsed time');
        return;
    }

    // Validate elapsed time
    const validation = validateTimeFormat(elapsedTime, format);
    if (!validation.isValid) {
        showRemainingError(`Elapsed Time: ${validation.error}`);
        return;
    }

    try {
        // Check if Ramadan mode is enabled
        const ramadanSwitch = document.getElementById('ramadanSwitch');
        const isRamadanMode = ramadanSwitch && ramadanSwitch.checked;
        
        // Use 6 hours in Ramadan mode, 7 hours otherwise
        const hours = isRamadanMode ? 6 : 7;
        const hoursStr = format === 'HHMMSS' ? `0${hours}:00:00` : `0${hours}:00`;
        
        // Calculate remaining time (hours - elapsed time)
        const remainingTime = subtractTimes(hoursStr, elapsedTime, format);
        
        // Get current time with selected UTC offset
        const currentTime = getCurrentTimeWithOffset(format);
        
        // Calculate final time (current time + remaining time)
        const finalTime = addTimes(currentTime, remainingTime, format);
        
        // Calculate free time if departure time is available
        let freeTime = null;
        if (storedDepartureTime) {
            freeTime = subtractTimes(storedDepartureTime, finalTime, format);
        }
        
        showRemainingResult(remainingTime, currentTime, finalTime, freeTime, isRamadanMode);
        
        // Start countdown timer
        startCountdown(remainingTime, format);
    } catch (error) {
        showRemainingError('An error occurred during calculation');
        console.error(error);
    }
}

/**
 * Start or restart the live countdown timer
 * @param {string} remainingTime - Remaining time string
 * @param {string} format - Time format
 */
function startCountdown(remainingTime, format) {
    // Clear existing countdown
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    const container = document.getElementById('countdownContainer');
    const valueEl = document.getElementById('countdownValue');
    const statusEl = document.getElementById('countdownStatus');
    
    container.classList.remove('hidden');
    
    // Parse remaining time to seconds
    let remainingSec = timeToSeconds(remainingTime, format);
    
    // If remaining time is negative, show finished
    if (remainingSec <= 0) {
        valueEl.textContent = '00:00:00';
        valueEl.className = 'countdown-value finished';
        statusEl.textContent = 'Work time completed!';
        return;
    }
    
    // Update display immediately
    updateCountdownDisplay(remainingSec, valueEl, statusEl);
    
    // Tick every second
    countdownInterval = setInterval(() => {
        remainingSec--;
        
        if (remainingSec <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            valueEl.textContent = '00:00:00';
            valueEl.className = 'countdown-value finished';
            statusEl.textContent = 'Work time completed!';
            
            // Also auto-recalculate if auto-elapsed is on
            const autoSwitch = document.getElementById('autoElapsedSwitch');
            if (autoSwitch && autoSwitch.checked) {
                updateAutoElapsedTime();
            }
            return;
        }
        
        updateCountdownDisplay(remainingSec, valueEl, statusEl);
        
        // Auto-update elapsed time and re-calc every 60 seconds
        const autoSwitch = document.getElementById('autoElapsedSwitch');
        if (autoSwitch && autoSwitch.checked && remainingSec % 60 === 0) {
            updateAutoElapsedTime();
        }
    }, 1000);
}

/**
 * Update countdown display elements
 * @param {number} seconds - Remaining seconds
 * @param {HTMLElement} valueEl - Value display element
 * @param {HTMLElement} statusEl - Status display element
 */
function updateCountdownDisplay(seconds, valueEl, statusEl) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    valueEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
    
    // Color coding based on remaining time
    if (seconds <= 300) { // 5 minutes or less
        valueEl.className = 'countdown-value critical';
        statusEl.textContent = 'Almost done!';
    } else if (seconds <= 1800) { // 30 minutes or less
        valueEl.className = 'countdown-value warning';
        statusEl.textContent = 'Less than 30 minutes remaining';
    } else {
        valueEl.className = 'countdown-value';
        const hoursLeft = Math.floor(seconds / 3600);
        const minsLeft = Math.floor((seconds % 3600) / 60);
        statusEl.textContent = `${hoursLeft}h ${minsLeft}m remaining`;
    }
}

/**
 * Show result in Remaining Time Calculator
 * @param {string} remainingTime - Remaining time to display
 * @param {string} currentTime - Current time in UTC+6
 * @param {string} finalTime - Final time to display
 * @param {string|null} freeTime - Free time to display (if available)
 * @param {boolean} isRamadanMode - Whether Ramadan mode is enabled
 */
function showRemainingResult(remainingTime, currentTime, finalTime, freeTime, isRamadanMode = false) {
    const resultDiv = document.getElementById('remainingResult');
    const resultValue = resultDiv.querySelector('.result-value');
    const errorDiv = document.getElementById('remainingError');
    
    errorDiv.classList.add('hidden');
    resultDiv.classList.remove('hidden');
    
    const hours = isRamadanMode ? '6 hours' : '7 hours';
    const modeText = isRamadanMode ? ' (Ramadan mode)' : '';
    const utcLabel = getUTCLabel();
    
    let html = `
        <div style="margin-bottom: 15px;">
            <strong>Remaining Time:</strong> ${remainingTime}
            <span style="font-size: 0.85em; color: #6c757d;">${modeText ? ` ${modeText}` : ''}</span>
        </div>
        <div style="margin-bottom: 15px; font-size: 0.9em; color: #6c757d;">
            <strong>Current Time (${utcLabel}):</strong> ${currentTime}
        </div>
        <div style="margin-bottom: 15px; font-size: 1.3em; color: #667eea;">
            <strong>Final Time:</strong> ${finalTime}
        </div>
    `;
    
    if (freeTime !== null) {
        html += `
            <div style="font-size: 1.3em; color: #28a745; margin-top: 20px; padding-top: 15px; border-top: 2px solid #e0e0e0;">
                <strong>Free Time:</strong> ${freeTime}
            </div>
        `;
    } else {
        html += `
            <div style="font-size: 0.85em; color: #dc3545; margin-top: 15px; font-style: italic;">
                Calculate Shift Time first to see Free Time
            </div>
        `;
    }
    
    resultValue.innerHTML = html;
}

/**
 * Show error in Remaining Time Calculator
 * @param {string} errorMessage - Error message to display
 */
function showRemainingError(errorMessage) {
    const resultDiv = document.getElementById('remainingResult');
    const errorDiv = document.getElementById('remainingError');
    
    resultDiv.classList.add('hidden');
    errorDiv.classList.remove('hidden');
    errorDiv.textContent = '⚠️ ' + errorMessage;
}

// ============================================================================
// AUTO-FORMATTING - Automatically insert colons as user types
// ============================================================================

/**
 * Auto-format time input with colons
 * @param {Event} e - Input event
 */
function autoFormatTime(e) {
    const input = e.target;
    let value = input.value.replace(/:/g, ''); // Remove existing colons
    const format = document.querySelector('input[name="format"]:checked').value;
    
    // Only keep digits
    value = value.replace(/\D/g, '');
    
    // Format based on selected format
    if (format === 'HHMMSS') {
        // Limit to 6 digits (HHMMSS)
        value = value.substring(0, 6);
        
        // Add colons: HH:MM:SS
        if (value.length >= 2) {
            value = value.substring(0, 2) + ':' + value.substring(2);
        }
        if (value.length >= 5) {
            value = value.substring(0, 5) + ':' + value.substring(5);
        }
    } else {
        // Limit to 4 digits (HHMM)
        value = value.substring(0, 4);
        
        // Add colon: HH:MM
        if (value.length >= 2) {
            value = value.substring(0, 2) + ':' + value.substring(2);
        }
    }
    
    input.value = value;
}

// ============================================================================
// TIME PICKER - Scroll drum-roller time picker for arrival time
// ============================================================================

/** Item height in px for the drum picker */
const DRUM_ITEM_HEIGHT = 50;

/**
 * Build the list items inside a drum container
 * @param {HTMLElement} listEl - The .tp-drum-list element
 * @param {number} max - Maximum value (exclusive), e.g. 24 or 60
 */
function buildDrumItems(listEl, max) {
    listEl.innerHTML = '';
    // Top spacer so first item can sit in the center highlight
    const topSpacer = document.createElement('div');
    topSpacer.className = 'tp-drum-item tp-drum-spacer';
    topSpacer.textContent = '';
    listEl.appendChild(topSpacer);

    for (let i = 0; i < max; i++) {
        const item = document.createElement('div');
        item.className = 'tp-drum-item';
        item.textContent = i.toString().padStart(2, '0');
        item.dataset.value = i;
        listEl.appendChild(item);
    }

    // Bottom spacer so last item can sit in the center highlight
    const bottomSpacer = document.createElement('div');
    bottomSpacer.className = 'tp-drum-item tp-drum-spacer';
    bottomSpacer.textContent = '';
    listEl.appendChild(bottomSpacer);
}

/**
 * Scroll a drum to a specific value (centered in the highlight)
 * @param {HTMLElement} drumEl - The .tp-drum container
 * @param {number} value - The numeric value to scroll to
 * @param {boolean} smooth - Whether to animate
 */
function scrollDrumToValue(drumEl, value, smooth) {
    // +1 accounts for the top spacer item
    const targetScroll = (value + 1) * DRUM_ITEM_HEIGHT - DRUM_ITEM_HEIGHT;
    drumEl.scrollTo({ top: targetScroll, behavior: smooth ? 'smooth' : 'instant' });
}

/**
 * Get the currently selected value from a drum's scroll position
 * @param {HTMLElement} drumEl - The .tp-drum container
 * @returns {number}
 */
function getDrumValue(drumEl) {
    const raw = Math.round(drumEl.scrollTop / DRUM_ITEM_HEIGHT);
    const type = drumEl.dataset.type;
    const max = type === 'hours' ? 23 : 59;
    return Math.max(0, Math.min(max, raw));
}

/**
 * Update the active highlight class on drum items based on scroll position
 * @param {HTMLElement} drumEl - The .tp-drum container
 */
function updateDrumActiveItem(drumEl) {
    const val = getDrumValue(drumEl);
    const items = drumEl.querySelectorAll('.tp-drum-item');
    items.forEach(item => {
        item.classList.toggle('active', parseInt(item.dataset.value, 10) === val);
    });
}

/**
 * Initialize the time picker widget and bind all its events
 */
function initTimePicker() {
    const toggleBtn = document.getElementById('timePickerToggle');
    const widget = document.getElementById('timePickerWidget');
    const setBtn = document.getElementById('timePickerSet');
    const cancelBtn = document.getElementById('timePickerCancel');
    const nowBtn = document.getElementById('timePickerNow');

    const hoursDrum = document.getElementById('tpHoursDrum');
    const minutesDrum = document.getElementById('tpMinutesDrum');
    const secondsDrum = document.getElementById('tpSecondsDrum');
    const hoursList = document.getElementById('tpHoursList');
    const minutesList = document.getElementById('tpMinutesList');
    const secondsList = document.getElementById('tpSecondsList');

    if (!toggleBtn || !widget) return;

    // Build drum items
    buildDrumItems(hoursList, 24);
    buildDrumItems(minutesList, 60);
    buildDrumItems(secondsList, 60);

    // Add highlight overlays to each drum
    [hoursDrum, minutesDrum, secondsDrum].forEach(drum => {
        const highlight = document.createElement('div');
        highlight.className = 'tp-drum-highlight';
        drum.appendChild(highlight);
    });

    // Snap and highlight on scroll end (debounced)
    const drums = [hoursDrum, minutesDrum, secondsDrum];
    drums.forEach(drum => {
        let scrollTimer = null;
        drum.addEventListener('scroll', () => {
            updateDrumActiveItem(drum);
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                // Snap to nearest item
                const val = getDrumValue(drum);
                scrollDrumToValue(drum, val, true);
                updateDrumActiveItem(drum);
            }, 80);
        });
    });

    // Click on item to select it
    drums.forEach(drum => {
        drum.addEventListener('click', function(e) {
            const item = e.target.closest('.tp-drum-item');
            if (item) {
                const val = parseInt(item.dataset.value, 10);
                scrollDrumToValue(drum, val, true);
            }
        });
    });

    // Toggle picker visibility
    toggleBtn.addEventListener('click', function() {
        const isHidden = widget.classList.contains('hidden');
        if (isHidden) {
            syncPickerFromInput();
            updatePickerSecondsVisibility();
        }
        widget.classList.toggle('hidden');
    });

    // Set button
    setBtn.addEventListener('click', function() {
        applyPickerToInput();
        widget.classList.add('hidden');
    });

    // Cancel button
    cancelBtn.addEventListener('click', function() {
        widget.classList.add('hidden');
    });

    // Now button - set to current time
    nowBtn.addEventListener('click', function() {
        const format = document.querySelector('input[name="format"]:checked').value;
        const now = getCurrentTimeWithOffset(format);
        const parts = now.split(':');
        scrollDrumToValue(hoursDrum, parseInt(parts[0], 10) || 0, true);
        scrollDrumToValue(minutesDrum, parseInt(parts[1], 10) || 0, true);
        scrollDrumToValue(secondsDrum, parseInt(parts[2], 10) || 0, true);
    });

    // Preset buttons
    document.querySelectorAll('.tp-preset').forEach(btn => {
        btn.addEventListener('click', function() {
            const time = this.getAttribute('data-time');
            const parts = time.split(':');
            scrollDrumToValue(hoursDrum, parseInt(parts[0], 10) || 0, true);
            scrollDrumToValue(minutesDrum, parseInt(parts[1], 10) || 0, true);
            scrollDrumToValue(secondsDrum, 0, true);
        });
    });

    // Set initial scroll positions
    scrollDrumToValue(hoursDrum, 9, false);
    scrollDrumToValue(minutesDrum, 0, false);
    scrollDrumToValue(secondsDrum, 0, false);
    setTimeout(() => drums.forEach(updateDrumActiveItem), 50);
}

/**
 * Sync the drum picker from the text input value
 */
function syncPickerFromInput() {
    const mainInput = document.getElementById('shiftArrivalTime');
    const value = mainInput.value.trim();
    if (!value) return;

    const parts = value.split(':');
    const hoursDrum = document.getElementById('tpHoursDrum');
    const minutesDrum = document.getElementById('tpMinutesDrum');
    const secondsDrum = document.getElementById('tpSecondsDrum');

    scrollDrumToValue(hoursDrum, parseInt(parts[0], 10) || 0, false);
    scrollDrumToValue(minutesDrum, parseInt(parts[1], 10) || 0, false);
    scrollDrumToValue(secondsDrum, parseInt(parts[2], 10) || 0, false);

    setTimeout(() => {
        updateDrumActiveItem(hoursDrum);
        updateDrumActiveItem(minutesDrum);
        updateDrumActiveItem(secondsDrum);
    }, 50);
}

/**
 * Apply the drum picker values to the main input
 */
function applyPickerToInput() {
    const format = document.querySelector('input[name="format"]:checked').value;
    const h = getDrumValue(document.getElementById('tpHoursDrum'));
    const m = getDrumValue(document.getElementById('tpMinutesDrum'));
    const s = getDrumValue(document.getElementById('tpSecondsDrum'));

    const mainInput = document.getElementById('shiftArrivalTime');
    const hStr = h.toString().padStart(2, '0');
    const mStr = m.toString().padStart(2, '0');
    const sStr = s.toString().padStart(2, '0');

    if (format === 'HHMMSS') {
        mainInput.value = `${hStr}:${mStr}:${sStr}`;
    } else {
        mainInput.value = `${hStr}:${mStr}`;
    }
}

/**
 * Show/hide the seconds drum based on selected format
 */
function updatePickerSecondsVisibility() {
    const format = document.querySelector('input[name="format"]:checked').value;
    const secColumn = document.querySelector('.tp-spinner-seconds');
    const secColon = document.querySelector('.tp-colon-seconds');

    if (secColumn && secColon) {
        if (format === 'HHMMSS') {
            secColumn.style.display = '';
            secColon.style.display = '';
        } else {
            secColumn.style.display = 'none';
            secColon.style.display = 'none';
        }
    }
}

// ============================================================================
// RAMS INTEGRATION - Dual-strategy fetch (Direct → Apache Proxy fallback)
//
// Strategy 1: Direct fetch to RAMS (works if CORS extension is enabled or
//             the browser allows it — fastest, no server config needed).
// Strategy 2: Apache reverse proxy — /rams-api/* proxied to rumytechnologies.com
//             (always works when XAMPP Apache is configured with mod_proxy).
//
// The code automatically tries Strategy 1 first, and silently falls back to
// Strategy 2 if the direct request fails (e.g. CORS blocked).
// ============================================================================

/** RAMS endpoint configurations for each strategy */
const RAMS_STRATEGIES = [
    {
        name: 'Direct',
        loginUrl: 'https://rumytechnologies.com/rams/user/login',
        dataUrl: 'https://rumytechnologies.com/rams/get_first_in_last_out_log2',
        fetchOptions: { credentials: 'include' }   // send cookies cross-origin
    },
    {
        name: 'Apache Proxy',
        loginUrl: '/rams-api/user/login',
        dataUrl: '/rams-api/get_first_in_last_out_log2',
        fetchOptions: {}                            // same-origin, cookies automatic
    }
];

/**
 * Show RAMS status message (supports HTML content)
 * @param {string} message - The message text or HTML
 * @param {string} type - 'success', 'error', or 'loading'
 * @param {boolean} [isHtml=false] - If true, set innerHTML instead of textContent
 */
function showRAMSStatus(message, type, isHtml) {
    const status = document.getElementById('ramsStatus');
    if (!status) return;
    if (isHtml) {
        status.innerHTML = message;
    } else {
        status.textContent = message;
    }
    status.className = 'rams-status rams-status-' + type;
    status.classList.remove('hidden');
}

/**
 * Set RAMS fetch button loading state
 * @param {boolean} loading - Whether to show loading state
 */
function setRAMSLoading(loading) {
    const btn = document.getElementById('ramsFetchBtn');
    const text = document.getElementById('ramsFetchText');
    const spinner = document.getElementById('ramsFetchSpinner');
    if (!btn || !text || !spinner) return;

    if (loading) {
        btn.disabled = true;
        text.textContent = 'Fetching...';
        spinner.classList.remove('hidden');
    } else {
        btn.disabled = false;
        text.textContent = 'Fetch Attendance';
        spinner.classList.add('hidden');
    }
}

/**
 * Extract CSRF _formkey token from RAMS login page HTML
 * @param {string} html - Login page HTML
 * @returns {string|null} The _formkey value or null
 */
function extractFormKey(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const formKeyInput = doc.querySelector('input[name="_formkey"]');
    return formKeyInput ? formKeyInput.value : null;
}

/**
 * Parse RAMS attendance table HTML and extract employee records.
 * Table columns (11 total):
 *   [0] "+" expand btn | [1] User name | [2] Phone | [3] Department
 *   [4] Access Date | [5] In Device ID | [6] First In Time
 *   [7] Out Device ID | [8] Last Out Time | [9] (empty) | [10] Duration
 * @param {string} html - Data page HTML
 * @returns {Array<{name: string, firstIn: string}>}
 */
function parseRAMSTable(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('table tbody tr');
    const records = [];
    const seen = new Set();

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 7) {
            const name = cells[1] ? cells[1].textContent.trim() : '';
            const firstIn = cells[6] ? cells[6].textContent.trim() : '';

            if (name && firstIn && firstIn !== '-' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(firstIn) && !seen.has(name)) {
                seen.add(name);
                records.push({ name: name, firstIn: firstIn });
            }
        }
    });

    return records;
}

/**
 * Populate the employee dropdown with RAMS records
 * @param {Array<{name: string, firstIn: string}>} records
 */
function populateEmployeeDropdown(records) {
    const select = document.getElementById('ramsEmployeeSelect');
    const container = document.getElementById('ramsDropdownContainer');
    if (!select || !container) return;

    select.innerHTML = '<option value="">-- Select an employee --</option>';

    records.forEach(record => {
        const option = document.createElement('option');
        option.value = record.firstIn;
        option.textContent = record.name + ' \u2014 ' + record.firstIn;
        select.appendChild(option);
    });

    container.classList.remove('hidden');
}

/**
 * Save or clear RAMS credentials based on "Remember me" checkbox
 */
function saveRAMSCredentials(username, password) {
    if (document.getElementById('ramsRemember').checked) {
        localStorage.setItem('ramsUsername', username);
        localStorage.setItem('ramsPassword', btoa(password));
        localStorage.setItem('ramsRememberMe', 'true');
    } else {
        localStorage.removeItem('ramsUsername');
        localStorage.removeItem('ramsPassword');
        localStorage.removeItem('ramsRememberMe');
    }
}

/**
 * Attempt RAMS login + data fetch using a specific strategy.
 * @param {object} strategy - One of RAMS_STRATEGIES entries
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{records: Array, strategy: string}>} Resolved with records on success
 * @throws {Error} On any failure (CORS, network, auth, parse)
 */
async function tryRAMSStrategy(strategy, username, password) {
    const opts = strategy.fetchOptions;
    const tag = '[RAMS:' + strategy.name + ']';

    // Step 1: GET login page → extract CSRF _formkey
    console.log(tag, 'GET', strategy.loginUrl);
    const loginPageRes = await fetch(strategy.loginUrl, { ...opts });
    console.log(tag, 'Login page response:', loginPageRes.status, loginPageRes.statusText);
    if (!loginPageRes.ok) {
        throw new Error('HTTP ' + loginPageRes.status + ' from ' + strategy.name);
    }

    const loginHtml = await loginPageRes.text();
    const formKey = extractFormKey(loginHtml);
    console.log(tag, '_formkey extracted:', formKey ? 'YES (' + formKey.substring(0, 12) + '...)' : 'NO');
    if (!formKey) throw new Error('No _formkey found via ' + strategy.name);

    // Step 2: POST login
    const body = new URLSearchParams({
        username: username,
        password: password,
        _next: '/rams/get_first_in_last_out_log2',
        _formkey: formKey,
        _formname: 'login'
    });

    console.log(tag, 'POST', strategy.loginUrl, '(logging in as', username + ')');
    const loginRes = await fetch(strategy.loginUrl, {
        ...opts,
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        redirect: 'follow'
    });
    console.log(tag, 'Login response:', loginRes.status, loginRes.statusText, '| Redirected:', loginRes.redirected, '| URL:', loginRes.url);

    const resultHtml = await loginRes.text();

    // Check for bad credentials (throw specific error to stop all retries)
    if (resultHtml.includes('Invalid login') || resultHtml.includes('invalid credentials')) {
        console.error(tag, 'Authentication failed — invalid credentials');
        const err = new Error('Invalid username or password.');
        err.isAuthError = true;   // flag so caller skips fallback
        throw err;
    }

    // Try to parse data from the response (may have redirected to data page)
    let records = parseRAMSTable(resultHtml);
    console.log(tag, 'Records from login response:', records.length);

    // If not on data page yet, fetch it explicitly (session cookie persists)
    if (records.length === 0) {
        console.log(tag, 'GET', strategy.dataUrl, '(fetching data page separately)');
        const dataRes = await fetch(strategy.dataUrl, { ...opts });
        console.log(tag, 'Data page response:', dataRes.status, dataRes.statusText);
        if (!dataRes.ok) throw new Error('Data fetch HTTP ' + dataRes.status + ' via ' + strategy.name);
        const dataHtml = await dataRes.text();

        if (dataHtml.includes('name="_formname" value="login"')) {
            console.error(tag, 'Data page returned login form — session lost');
            throw new Error('Session lost via ' + strategy.name);
        }
        records = parseRAMSTable(dataHtml);
        console.log(tag, 'Records from data page:', records.length);
    }

    if (records.length === 0) {
        console.warn(tag, 'No records with valid First-In time found');
        const err = new Error('No attendance records with First-In time found for today.');
        err.isEmptyData = true;   // flag so caller skips fallback
        throw err;
    }

    console.log(tag, 'SUCCESS — found', records.length, 'records');
    return { records: records, strategy: strategy.name };
}

/**
 * Main RAMS fetch — tries Direct fetch first, then Apache Proxy fallback.
 * Authentication errors and empty-data results stop immediately (no fallback).
 */
async function fetchRAMSData() {
    const username = document.getElementById('ramsUsername').value.trim();
    const password = document.getElementById('ramsPassword').value.trim();

    if (!username || !password) {
        showRAMSStatus('Please enter both username and password.', 'error');
        return;
    }

    setRAMSLoading(true);

    let lastError = null;

    for (let i = 0; i < RAMS_STRATEGIES.length; i++) {
        const strategy = RAMS_STRATEGIES[i];
        const isLast = (i === RAMS_STRATEGIES.length - 1);

        showRAMSStatus(
            (i === 0 ? 'Connecting' : 'Retrying') + ' via ' + strategy.name + '...',
            'loading'
        );
        console.log('[RAMS] Trying strategy: ' + strategy.name);

        try {
            const result = await tryRAMSStrategy(strategy, username, password);

            // Success!
            populateEmployeeDropdown(result.records);
            showRAMSStatus(
                'Found ' + result.records.length + ' records via ' + result.strategy + '. Select an employee below.',
                'success'
            );
            saveRAMSCredentials(username, password);
            setRAMSLoading(false);
            return;

        } catch (err) {
            console.warn('[RAMS] ' + strategy.name + ' failed:', err.message);
            lastError = err;

            // Auth error or empty data → don't retry with another strategy
            if (err.isAuthError || err.isEmptyData) {
                showRAMSStatus(err.message, 'error');
                setRAMSLoading(false);
                return;
            }

            // If not the last strategy, continue to next
            if (!isLast) {
                console.log('[RAMS] Falling back to next strategy...');
            }
        }
    }

    // All strategies failed
    showRAMSStatus(
        'Could not connect to RAMS. Last error: ' + (lastError ? lastError.message : 'Unknown'),
        'error'
    );
    setRAMSLoading(false);
}

/**
 * Apply selected employee's first-in time to the arrival time input
 */
function applyRAMSTime() {
    const select = document.getElementById('ramsEmployeeSelect');
    if (!select || !select.value) {
        showRAMSStatus('Please select an employee first.', 'error');
        return;
    }

    const arrivalInput = document.getElementById('shiftArrivalTime');
    if (!arrivalInput) return;

    arrivalInput.value = select.value;
    arrivalInput.dispatchEvent(new Event('input', { bubbles: true }));

    if (typeof syncPickerFromInput === 'function') {
        syncPickerFromInput();
    }

    showRAMSStatus('Arrival time set to ' + select.value, 'success');

    // Auto-collapse panel after applying
    setTimeout(() => {
        const panel = document.getElementById('ramsPanel');
        const arrow = document.getElementById('ramsArrow');
        if (panel && !panel.classList.contains('hidden')) {
            panel.classList.add('hidden');
            if (arrow) arrow.textContent = '\u25BC';
        }
    }, 800);
}

/**
 * Initialize RAMS UI: bind events, restore saved credentials
 */
function initRAMS() {
    const toggleBtn = document.getElementById('ramsToggleBtn');
    const panel = document.getElementById('ramsPanel');
    const arrow = document.getElementById('ramsArrow');

    if (toggleBtn && panel) {
        toggleBtn.addEventListener('click', function() {
            panel.classList.toggle('hidden');
            if (arrow) {
                arrow.textContent = panel.classList.contains('hidden') ? '\u25BC' : '\u25B2';
            }
        });
    }

    // Fetch button
    const fetchBtn = document.getElementById('ramsFetchBtn');
    if (fetchBtn) fetchBtn.addEventListener('click', fetchRAMSData);

    // Apply button
    const applyBtn = document.getElementById('ramsApplyBtn');
    if (applyBtn) applyBtn.addEventListener('click', applyRAMSTime);

    // Enter key triggers fetch from credential fields
    const usernameInput = document.getElementById('ramsUsername');
    const passwordInput = document.getElementById('ramsPassword');
    if (usernameInput) {
        usernameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') fetchRAMSData();
        });
    }
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') fetchRAMSData();
        });
    }

    // Restore saved credentials
    if (localStorage.getItem('ramsRememberMe') === 'true') {
        const savedUser = localStorage.getItem('ramsUsername');
        const savedPass = localStorage.getItem('ramsPassword');
        if (savedUser && usernameInput) usernameInput.value = savedUser;
        if (savedPass && passwordInput) {
            try { passwordInput.value = atob(savedPass); } catch (e) { /* ignore */ }
        }
        const rememberCheckbox = document.getElementById('ramsRemember');
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }
}

// ============================================================================
// TIMEDOCTOR INTEGRATION - Dual-strategy fetch (Direct → Apache Proxy)
//
// TimeDoctor 2 uses a REST API with JWT token auth.
// Strategy 1: Direct fetch to api2.timedoctor.com (needs CORS extension).
// Strategy 2: Apache proxy /td-api/* → api2.timedoctor.com/api/1.0/*
//
// Flow: check stored token → if expired/missing, login → fetch today's stats
// ============================================================================

/** TimeDoctor API strategy configs */
const TD_STRATEGIES = [
    {
        name: 'Direct',
        baseUrl: 'https://api2.timedoctor.com/api/1.0',
    },
    {
        name: 'Apache Proxy',
        baseUrl: '/td-api',
    }
];

/** Show TimeDoctor status */
function showTDStatus(message, type, isHtml) {
    const status = document.getElementById('tdStatus');
    if (!status) return;
    if (isHtml) {
        status.innerHTML = message;
    } else {
        status.textContent = message;
    }
    status.className = 'rams-status rams-status-' + type;
    status.classList.remove('hidden');
}

/** Set TimeDoctor fetch button loading state */
function setTDLoading(loading) {
    const btn = document.getElementById('tdFetchBtn');
    const text = document.getElementById('tdFetchText');
    const spinner = document.getElementById('tdFetchSpinner');
    if (!btn || !text || !spinner) return;

    if (loading) {
        btn.disabled = true;
        text.textContent = 'Fetching...';
        spinner.classList.remove('hidden');
    } else {
        btn.disabled = false;
        text.textContent = 'Fetch Time Worked';
        spinner.classList.add('hidden');
    }
}

/** Save/clear TD credentials + token */
function saveTDCredentials(email, password) {
    if (document.getElementById('tdRemember').checked) {
        localStorage.setItem('tdEmail', email);
        localStorage.setItem('tdPassword', btoa(password));
        localStorage.setItem('tdRememberMe', 'true');
    } else {
        localStorage.removeItem('tdEmail');
        localStorage.removeItem('tdPassword');
        localStorage.removeItem('tdRememberMe');
    }
}

/** Save TD auth data (token, companyId, userId) — tied to email */
function saveTDToken(data, email) {
    localStorage.setItem('tdToken', data.token);
    localStorage.setItem('tdCompanyId', data.companyId);
    localStorage.setItem('tdUserId', data.userId);
    localStorage.setItem('tdTokenEmail', email.toLowerCase());
    localStorage.setItem('tdTokenTime', Date.now().toString());
}

/** Clear stored TD token */
function clearTDToken() {
    localStorage.removeItem('tdToken');
    localStorage.removeItem('tdCompanyId');
    localStorage.removeItem('tdUserId');
    localStorage.removeItem('tdTokenEmail');
    localStorage.removeItem('tdTokenTime');
}

/** Get stored TD auth data — only if it matches the given email */
function getTDToken(email) {
    const token = localStorage.getItem('tdToken');
    const companyId = localStorage.getItem('tdCompanyId');
    const userId = localStorage.getItem('tdUserId');
    const storedEmail = localStorage.getItem('tdTokenEmail');
    const tokenTime = parseInt(localStorage.getItem('tdTokenTime') || '0', 10);

    if (!token || !companyId || !userId) return null;

    // Different user? Don't reuse token
    if (email && storedEmail && storedEmail.toLowerCase() !== email.toLowerCase()) {
        console.log('[TD] Stored token is for', storedEmail, '— current user is', email, '— clearing');
        clearTDToken();
        return null;
    }

    // Token older than 6 hours? Consider it expired
    if (Date.now() - tokenTime > 6 * 60 * 60 * 1000) {
        console.log('[TD] Stored token expired (>6h old)');
        clearTDToken();
        return null;
    }

    return { token: token, companyId: companyId, userId: userId };
}

/**
 * Convert total seconds to HH:MM:SS string
 * @param {number} totalSeconds
 * @returns {string}
 */
function secondsToHMS(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

/**
 * Try fetching TimeDoctor data using a specific strategy.
 * Step 1: Validate stored token or login fresh.
 * Step 2: Fetch all company users.
 * Step 3: Fetch today's worklog for all users.
 * Step 4: Return per-user time worked records (like RAMS).
 *
 * @param {object} strategy - One of TD_STRATEGIES
 * @param {string} email
 * @param {string} password
 * @param {object|null} storedAuth - Previously stored token data
 * @returns {Promise<{records: Array, strategy: string, auth: object}>}
 */
async function tryTDStrategy(strategy, email, password, storedAuth) {
    const tag = '[TD:' + strategy.name + ']';
    const base = strategy.baseUrl;

    let auth = storedAuth;

    // Step 1: If we have a token, verify it works
    if (auth) {
        console.log(tag, 'Testing stored token...');
        try {
            const testRes = await fetch(base + '/users?company=' + auth.companyId + '&token=' + auth.token, {
                headers: { 'Authorization': 'JWT ' + auth.token }
            });
            console.log(tag, 'Token test response:', testRes.status);
            if (testRes.status === 401 || testRes.status === 403) {
                console.log(tag, 'Stored token rejected, will re-login');
                auth = null;
            } else if (!testRes.ok) {
                throw new Error('Token test HTTP ' + testRes.status);
            }
        } catch (err) {
            console.warn(tag, 'Token test failed:', err.message);
            auth = null;
        }
    }

    // Step 2: Login if no valid token
    if (!auth) {
        console.log(tag, 'POST', base + '/authorization/login');
        const loginRes = await fetch(base + '/authorization/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: password,
                permissions: 'read'
            })
        });

        console.log(tag, 'Login response:', loginRes.status, loginRes.statusText);

        if (loginRes.status === 401 || loginRes.status === 403) {
            const err = new Error('Invalid email or password.');
            err.isAuthError = true;
            throw err;
        }
        if (!loginRes.ok) {
            throw new Error('Login HTTP ' + loginRes.status + ' via ' + strategy.name);
        }

        const loginData = await loginRes.json();
        console.log(tag, 'Login response FULL:', JSON.stringify(loginData).substring(0, 1500));

        const d = loginData.data || loginData;
        const token = d.token || (d.user && d.user.token);

        let companyId = d.companyId
            || (d.company && d.company.id)
            || (d.companies && d.companies.length > 0 && d.companies[0].id)
            || (d.user && d.user.companyId);

        let userId = d.userId
            || (d.user && d.user.id)
            || d.id;

        console.log(tag, 'Extracted — token:', token ? (token.substring(0, 20) + '...') : 'MISSING',
            '| companyId:', companyId, '| userId:', userId);

        if (!token) {
            console.error(tag, 'No token in login response:', JSON.stringify(loginData).substring(0, 500));
            throw new Error('No auth token received via ' + strategy.name);
        }

        auth = { token: token, companyId: companyId, userId: userId };
        console.log(tag, 'Authenticated — companyId:', companyId, 'userId:', userId);

        saveTDToken(auth, email);
    }

    const authHeaders = { 'Authorization': 'JWT ' + auth.token };
    const tokenParam = '&token=' + auth.token;

    // Step 3: Fetch all users in the company
    console.log(tag, 'GET /users for company');
    const usersUrl = base + '/users?company=' + auth.companyId + '&limit=200' + tokenParam;
    const usersRes = await fetch(usersUrl, { headers: authHeaders });
    console.log(tag, 'Users response:', usersRes.status, usersRes.statusText);

    let userMap = {};   // userId → name
    let userIds = [];
    let isAdmin = false;

    if (usersRes.ok) {
        const usersData = await usersRes.json();
        const userList = usersData.data || usersData;
        console.log(tag, 'Users found:', Array.isArray(userList) ? userList.length : 'not array');

        if (Array.isArray(userList) && userList.length > 1) {
            isAdmin = true;
            userList.forEach(function(u) {
                const uid = u.id || u.userId || u._id;
                const name = u.name || u.fullName || u.email || uid;
                if (uid && u.active !== false) {
                    userMap[uid] = name;
                    userIds.push(uid);
                }
            });
        } else if (Array.isArray(userList) && userList.length === 1) {
            const u = userList[0];
            const uid = u.id || u.userId || u._id;
            userMap[uid] = u.name || u.fullName || u.email || uid;
            userIds.push(uid);
        }
    }

    // If only one user or couldn't list, just use the logged-in user
    if (userIds.length === 0) {
        userIds = [auth.userId];
        userMap[auth.userId] = email;
    }

    console.log(tag, 'Fetching worklogs for', userIds.length, 'user(s), isAdmin:', isAdmin);

    // Step 4: Fetch today's worklog for all users
    const today = new Date();
    const dateStr = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');

    // Build user param: pass all user IDs to get everybody's worklog
    const userParam = isAdmin ? userIds.join(',') : auth.userId;

    const worklogUrl = base + '/activity/worklog' +
        '?company=' + auth.companyId +
        '&user=' + userParam +
        '&from=' + dateStr + 'T00:00:00' +
        '&to=' + dateStr + 'T23:59:59' +
        tokenParam;

    console.log(tag, 'GET activity/worklog for', dateStr);
    const worklogRes = await fetch(worklogUrl, { headers: authHeaders });
    console.log(tag, 'Worklog response:', worklogRes.status, worklogRes.statusText);

    if (worklogRes.status === 401 || worklogRes.status === 403) {
        const errBody = await worklogRes.text();
        console.error(tag, 'Worklog auth error:', errBody.substring(0, 500));
        clearTDToken();
        throw new Error('Token expired during fetch via ' + strategy.name);
    }

    if (!worklogRes.ok) {
        throw new Error('Worklog HTTP ' + worklogRes.status + ' via ' + strategy.name);
    }

    const worklogData = await worklogRes.json();
    console.log(tag, 'Worklog response:', JSON.stringify(worklogData).substring(0, 1200));

    // Parse worklog — responses can be:
    //   { data: [ [entries_user1], [entries_user2], ... ] }  (multi-user)
    //   { data: [ [entries] ] }  (single user)
    // Each entry: { userId, start, time, ... }

    // Sum time per userId
    let perUser = {};   // userId → totalSeconds

    if (worklogData.data && Array.isArray(worklogData.data)) {
        worklogData.data.forEach(function(item) {
            let entries = [];
            if (Array.isArray(item)) {
                entries = item;
            } else if (item && typeof item === 'object') {
                entries = [item];
            }

            entries.forEach(function(entry) {
                const uid = entry.userId || auth.userId;
                if (!perUser[uid]) perUser[uid] = 0;

                if (entry.time && typeof entry.time === 'number') {
                    perUser[uid] += entry.time;
                } else if (entry.duration && typeof entry.duration === 'number') {
                    perUser[uid] += entry.duration;
                } else if (entry.total && typeof entry.total === 'number') {
                    perUser[uid] += entry.total;
                }
            });
        });
    }

    console.log(tag, 'Per-user seconds:', JSON.stringify(perUser));

    // Build records array: [{name, timeWorked (formatted)}]
    var records = [];
    // First add users that have tracked time
    userIds.forEach(function(uid) {
        const secs = perUser[uid] || 0;
        if (secs > 0) {
            records.push({
                name: userMap[uid] || uid,
                timeWorked: secondsToHMS(secs),
                seconds: secs,
                userId: uid
            });
        }
    });

    // Sort by time worked descending
    records.sort(function(a, b) { return b.seconds - a.seconds; });

    console.log(tag, 'Records with time:', records.length, 'out of', userIds.length, 'users');

    if (records.length === 0) {
        const err = new Error('No tracked time found for today.');
        err.isEmptyData = true;
        throw err;
    }

    return { records: records, strategy: strategy.name, auth: auth };
}

/**
 * Populate the TimeDoctor employee dropdown with records
 */
function populateTDDropdown(records) {
    const select = document.getElementById('tdEmployeeSelect');
    const container = document.getElementById('tdResultContainer');
    if (!select || !container) return;

    select.innerHTML = '<option value="">-- Select an employee --</option>';

    records.forEach(function(record) {
        const option = document.createElement('option');
        option.value = record.timeWorked;
        option.textContent = record.name + ' \u2014 ' + record.timeWorked;
        select.appendChild(option);
    });

    container.classList.remove('hidden');
}

/**
 * Main TimeDoctor fetch — tries Direct first, then Apache Proxy.
 * Checks stored token before prompting login.
 */
async function fetchTDData() {
    const email = document.getElementById('tdEmail').value.trim();
    const password = document.getElementById('tdPassword').value.trim();

    if (!email || !password) {
        showTDStatus('Please enter both email and password.', 'error');
        return;
    }

    setTDLoading(true);

    // Only reuse stored token if it belongs to the same email
    const storedAuth = getTDToken(email);
    let lastError = null;

    for (let i = 0; i < TD_STRATEGIES.length; i++) {
        const strategy = TD_STRATEGIES[i];
        const isLast = (i === TD_STRATEGIES.length - 1);

        showTDStatus(
            (i === 0 ? 'Connecting' : 'Retrying') + ' via ' + strategy.name + '...',
            'loading'
        );
        console.log('[TD] Trying strategy: ' + strategy.name);

        try {
            const result = await tryTDStrategy(strategy, email, password, storedAuth);

            // Success — populate dropdown like RAMS
            populateTDDropdown(result.records);

            showTDStatus(
                'Found ' + result.records.length + ' employee(s) with tracked time via ' + result.strategy + '. Select below.',
                'success'
            );
            saveTDCredentials(email, password);
            setTDLoading(false);
            return;

        } catch (err) {
            console.warn('[TD] ' + strategy.name + ' failed:', err.message);
            lastError = err;

            // Auth error → don't retry
            if (err.isAuthError) {
                showTDStatus(err.message, 'error');
                setTDLoading(false);
                return;
            }

            if (!isLast) {
                console.log('[TD] Falling back to next strategy...');
            }
        }
    }

    // All strategies failed
    showTDStatus(
        'Could not connect to TimeDoctor. ' + (lastError ? lastError.message : 'Unknown error'),
        'error'
    );
    setTDLoading(false);
}

/**
 * Apply selected employee's TimeDoctor time worked to the Elapsed Time input
 */
function applyTDTime() {
    const select = document.getElementById('tdEmployeeSelect');
    if (!select || !select.value) {
        showTDStatus('Please select an employee first.', 'error');
        return;
    }

    const elapsedInput = document.getElementById('elapsedTime');
    if (!elapsedInput) return;

    // Turn off auto-elapsed if it's on (since user wants manual override from TD)
    const autoSwitch = document.getElementById('autoElapsedSwitch');
    if (autoSwitch && autoSwitch.checked) {
        autoSwitch.checked = false;
        autoSwitch.dispatchEvent(new Event('change', { bubbles: true }));
    }

    elapsedInput.value = select.value;
    elapsedInput.dispatchEvent(new Event('input', { bubbles: true }));

    showTDStatus('Elapsed time set to ' + select.value, 'success');

    // Auto-collapse panel after applying
    setTimeout(function() {
        const panel = document.getElementById('tdPanel');
        const arrow = document.getElementById('tdArrow');
        if (panel && !panel.classList.contains('hidden')) {
            panel.classList.add('hidden');
            if (arrow) arrow.textContent = '\u25BC';
        }
    }, 800);
}

/**
 * Initialize TimeDoctor UI: bind events, restore saved credentials
 */
function initTimeDoctor() {
    const toggleBtn = document.getElementById('tdToggleBtn');
    const panel = document.getElementById('tdPanel');
    const arrow = document.getElementById('tdArrow');

    if (toggleBtn && panel) {
        toggleBtn.addEventListener('click', function() {
            panel.classList.toggle('hidden');
            if (arrow) {
                arrow.textContent = panel.classList.contains('hidden') ? '\u25BC' : '\u25B2';
            }
        });
    }

    // Fetch button
    const fetchBtn = document.getElementById('tdFetchBtn');
    if (fetchBtn) fetchBtn.addEventListener('click', fetchTDData);

    // Apply button
    const applyBtn = document.getElementById('tdApplyBtn');
    if (applyBtn) applyBtn.addEventListener('click', applyTDTime);

    // Enter key triggers fetch
    const emailInput = document.getElementById('tdEmail');
    const passInput = document.getElementById('tdPassword');
    if (emailInput) {
        emailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') fetchTDData();
        });
    }
    if (passInput) {
        passInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') fetchTDData();
        });
    }

    // Restore saved credentials
    if (localStorage.getItem('tdRememberMe') === 'true') {
        const savedEmail = localStorage.getItem('tdEmail');
        const savedPass = localStorage.getItem('tdPassword');
        if (savedEmail && emailInput) emailInput.value = savedEmail;
        if (savedPass && passInput) {
            try { passInput.value = atob(savedPass); } catch (e) { /* ignore */ }
        }
        const rememberCheckbox = document.getElementById('tdRemember');
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }
}

// ============================================================================
// TIMEZONE DETECTION - Auto-detect user's timezone
// ============================================================================

/**
 * Auto-detect the user's timezone offset and select it in the dropdown
 */
function autoDetectTimezone() {
    const selector = document.getElementById('utcOffset');
    if (!selector) return;
    
    // Get local timezone offset in hours (JS returns minutes, negative for ahead of UTC)
    const offsetMinutes = -(new Date().getTimezoneOffset());
    const offsetHours = offsetMinutes / 60;
    
    // Find the closest matching option
    let bestOption = null;
    let bestDiff = Infinity;
    
    for (const option of selector.options) {
        const optVal = parseFloat(option.value);
        const diff = Math.abs(optVal - offsetHours);
        if (diff < bestDiff) {
            bestDiff = diff;
            bestOption = option;
        }
    }
    
    if (bestOption) {
        selector.value = bestOption.value;
    }
}

// ============================================================================
// EVENT LISTENERS - Initialize application
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show corresponding tab content
            const targetContent = document.getElementById(targetTab + 'Tab');
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // Ramadan mode switch functionality
    const ramadanSwitch = document.getElementById('ramadanSwitch');
    if (ramadanSwitch) {
        ramadanSwitch.addEventListener('change', function() {
            if (this.checked) {
                console.log('Ramadan mode enabled - Using 7 hour shifts and 6 hour remaining time');
                // Update calculator descriptions
                updateShiftCalculatorText(true);
                updateRemainingCalculatorText(true);
            } else {
                console.log('Ramadan mode disabled - Using 9 hour shifts and 7 hour remaining time');
                // Restore normal calculator descriptions
                updateShiftCalculatorText(false);
                updateRemainingCalculatorText(false);
            }
        });
    }

    // Update Shift Time Calculator description based on Ramadan mode
    function updateShiftCalculatorText(isRamadan) {
        const shiftDescription = document.querySelector('#av1anTab .calculator-card:first-of-type .section-description');
        if (shiftDescription) {
            const hours = isRamadan ? '7' : '9';
            shiftDescription.textContent = `Enter arrival time to calculate departure time (+${hours} hours)`;
        }
    }

    // Update Remaining Time Calculator description based on Ramadan mode
    function updateRemainingCalculatorText(isRamadan) {
        const remainingDescription = document.querySelector('#av1anTab .calculator-card:nth-of-type(2) .section-description');
        if (remainingDescription) {
            const hours = isRamadan ? '6' : '7';
            remainingDescription.textContent = `Calculate remaining time (${hours} hours - elapsed time), final completion time, and free time`;
        }
    }

    // Calculate button event
    const calculateBtn = document.getElementById('calculateBtn');
    calculateBtn.addEventListener('click', handleCalculate);

    // Format selector event
    const formatRadios = document.querySelectorAll('input[name="format"]');
    formatRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            updatePlaceholders(this.value);
            updatePickerSecondsVisibility();
            // Clear inputs when format changes
            document.getElementById('time1').value = '';
            document.getElementById('time2').value = '';
            document.getElementById('result').classList.add('hidden');
            document.getElementById('error').classList.add('hidden');
        });
    });

    // Auto-format time inputs
    const time1Input = document.getElementById('time1');
    const time2Input = document.getElementById('time2');
    const shiftArrivalInput = document.getElementById('shiftArrivalTime');
    const elapsedTimeInput = document.getElementById('elapsedTime');
    
    time1Input.addEventListener('input', autoFormatTime);
    time2Input.addEventListener('input', autoFormatTime);
    shiftArrivalInput.addEventListener('input', autoFormatTime);
    elapsedTimeInput.addEventListener('input', autoFormatTime);

    // Optional elements (if Arrival Time Calculator exists)
    const departureInput = document.getElementById('departureTime');
    const durationInput = document.getElementById('duration');
    const arrivalInput = document.getElementById('arrivalTime');
    
    if (departureInput) departureInput.addEventListener('input', autoFormatTime);
    if (durationInput) durationInput.addEventListener('input', autoFormatTime);
    if (arrivalInput) arrivalInput.addEventListener('input', autoFormatTime);

    // Arrival Time Calculator button (if exists)
    const calculateArrivalBtn = document.getElementById('calculateArrivalBtn');
    if (calculateArrivalBtn) {
        calculateArrivalBtn.addEventListener('click', handleArrivalCalculate);
    }

    // Shift Calculator button
    const calculateShiftBtn = document.getElementById('calculateShiftBtn');
    calculateShiftBtn.addEventListener('click', handleShiftCalculate);

    // Remaining Time Calculator button
    const calculateRemainingBtn = document.getElementById('calculateRemainingBtn');
    calculateRemainingBtn.addEventListener('click', handleRemainingCalculate);

    // ---- UTC Timezone Selector ----
    const detectTimezoneBtn = document.getElementById('detectTimezoneBtn');
    if (detectTimezoneBtn) {
        detectTimezoneBtn.addEventListener('click', function() {
            autoDetectTimezone();
        });
    }

    // Auto-detect timezone on load
    autoDetectTimezone();

    // ---- Initialize RAMS Integration ----
    initRAMS();

    // ---- Initialize TimeDoctor Integration ----
    initTimeDoctor();

    // ---- Initialize Time Picker ----
    initTimePicker();

    // ---- Auto-elapsed switch ----
    const autoElapsedSwitch = document.getElementById('autoElapsedSwitch');
    if (autoElapsedSwitch) {
        autoElapsedSwitch.addEventListener('change', function() {
            const elapsedInput = document.getElementById('elapsedTime');
            const hint = document.getElementById('elapsedHint');
            
            if (this.checked) {
                elapsedInput.readOnly = true;
                elapsedInput.classList.add('auto-filled');
                updateAutoElapsedTime();
                
                // Start auto-update interval (every second)
                if (!window.autoElapsedInterval) {
                    window.autoElapsedInterval = setInterval(updateAutoElapsedTime, 1000);
                }
                
                if (!storedArrivalTime) {
                    if (hint) hint.textContent = 'Calculate Shift Time first to enable auto-elapsed';
                }
            } else {
                elapsedInput.readOnly = false;
                elapsedInput.classList.remove('auto-filled');
                if (hint) hint.textContent = 'Example: 05:30:00';
                
                // Stop auto-update interval
                if (window.autoElapsedInterval) {
                    clearInterval(window.autoElapsedInterval);
                    window.autoElapsedInterval = null;
                }
            }
        });
    }

    // Allow Enter key to calculate
    time1Input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleCalculate();
    });
    time2Input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleCalculate();
    });
    
    if (departureInput) {
        departureInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleArrivalCalculate();
        });
    }
    if (durationInput) {
        durationInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleArrivalCalculate();
        });
    }
    if (arrivalInput) {
        arrivalInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleArrivalCalculate();
        });
    }
    
    shiftArrivalInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleShiftCalculate();
    });
    
    elapsedTimeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleRemainingCalculate();
    });
});
