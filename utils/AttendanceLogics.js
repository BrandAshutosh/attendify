const crypto = require('crypto');
const geolib = require('geolib');

function compareBase64Images(img1, img2) {
    if (!img1 || !img2) return false;

    const hash1 = crypto.createHash('sha256').update(img1).digest('hex');
    const hash2 = crypto.createHash('sha256').update(img2).digest('hex');

    return hash1 === hash2;
}

function isLocationWithinRadius(userLocation, targetLocation, radiusInMeters = 100) {
    if (!userLocation || !targetLocation) return false;

    const distance = geolib.getDistance(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: targetLocation.latitude, longitude: targetLocation.longitude }
    );

    return distance <= radiusInMeters;
}

module.exports = {
    compareBase64Images,
    isLocationWithinRadius
};