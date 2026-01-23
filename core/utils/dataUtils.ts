export const sanitizeForFirestore = (data: any): any => {
    if (data === undefined) {
        return null;
    }

    if (data === null || typeof data !== 'object') {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(item => sanitizeForFirestore(item));
    }

    const sanitizedObject: { [key: string]: any } = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            if (value !== undefined) {
                sanitizedObject[key] = sanitizeForFirestore(value);
            }
        }
    }

    return sanitizedObject;
};