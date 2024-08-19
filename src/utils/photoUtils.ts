const sendNotification = async (userId: string, message: string) => {
  // TODO: use APNs (maybe node-apn)
  console.log(`Notification sent to user ${userId}: ${message}`);
};

const parsePhotoRequestBody = (body: any) => {
  try {
    const location = JSON.parse(body.location);
    const taggedUsers = JSON.parse(body.taggedUsers);

    if (
      typeof location.lat !== 'number' ||
      typeof location.lon !== 'number' ||
      !Array.isArray(taggedUsers)
    ) {
      throw new Error('Invalid input format');
    }

    return {
      location,
      taggedUsers,
    };
  } catch (error) {
    throw new Error('Invalid input format');
  }
};

export { sendNotification, parsePhotoRequestBody };
