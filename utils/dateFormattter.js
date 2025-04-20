const formatDate = (date) => {
    if (!date) return null;

    const formattedDate = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(new Date(date));

    return formattedDate.replace(/\b(am|pm)\b/g, (match) => match.toUpperCase());
};

module.exports = formatDate;