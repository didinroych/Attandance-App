/**
 * Get start of week (Monday) for a given date 
 * @param {Date} date - Any date in the week || @returns {Date} Start of week (Monday)
 */
const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
};

/**
 * Get end of week (Sunday) for a given date 
 * @param {Date} date - Any date in the week || @returns {Date} End of week (Sunday)
 */
const getEndOfWeek = (date) => {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
};

/**
 * Format time to HH:MM:SS string
 * 
 * @param {Date} date - Date to extract time from
 * @returns {String} Formatted time string
 */
const formatTime = (date) => {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

export {
    getStartOfWeek,
    getEndOfWeek,
    formatTime,
};