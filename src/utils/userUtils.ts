import User from '../models/userModel';

const resolveUsernamesToIds = async (usernames: string[]) => {
  const users = await User.find({ username: { $in: usernames } }, 'id');
  return users.map((user) => user.id);
};

export { resolveUsernamesToIds };
