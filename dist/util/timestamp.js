export function getTimestamp(objectId) {
    const timestamp = objectId.toString().substring(0, 8);
    return new Date(parseInt(timestamp, 16) * 1000);
}
