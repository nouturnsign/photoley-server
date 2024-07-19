import bcrypt from 'bcrypt';

// Compare plain password with hashed password
const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

export { comparePassword };
