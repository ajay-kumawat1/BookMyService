
import jwt from "jsonwebtoken";
import { Role } from "../../Common/common.js";
import { User } from '../UserModel';


jest.mock("jsonwebtoken");

describe('UserSchema() UserSchema method', () => {
  // Happy Path Tests
  describe('Happy Paths', () => {
    it('should create a user with default values', () => {
      // Test to ensure default values are set correctly
      const user = new User({
        firstName: 'John',
        email: 'john.doe@example.com',
        phoneNumber: '1234567890',
      });

      expect(user.firstName).toBe('John');
      expect(user.lastName).toBeNull();
      expect(user.email).toBe('john.doe@example.com');
      expect(user.password).toBeNull();
      expect(user.phoneNumber).toBe('1234567890');
      expect(user.avatar).toBe('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnFcoNkDNEQ9sXq36dfEj8FZjB4n_X3VFFew&s');
      expect(user.role).toBe(Role.USER);
      expect(user.isVerified).toBe(false);
    });

    it('should generate a valid JWT token', () => {
      // Test to ensure JWT token is generated correctly
      const user = new User({
        firstName: 'John',
        email: 'john.doe@example.com',
        phoneNumber: '1234567890',
      });

      const token = 'mockedToken';
      jwt.sign.mockReturnValue(token);

      const authToken = user.generateAuthToken();
      expect(authToken).toBe(token);
      expect(jwt.sign).toHaveBeenCalledWith(
        { uId: user._id, isAdmin: user.isAdmin },
        process.env.JWT_PRIVATE_KEY,
        { expiresIn: '24h' }
      );
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('should fail validation if firstName is missing', () => {
      // Test to ensure validation fails when firstName is missing
      const user = new User({
        email: 'john.doe@example.com',
        phoneNumber: '1234567890',
      });

      const error = user.validateSync();
      expect(error.errors.firstName).toBeDefined();
      expect(error.errors.firstName.message).toBe('The first name is required.');
    });

    it('should fail validation if email is missing', () => {
      // Test to ensure validation fails when email is missing
      const user = new User({
        firstName: 'John',
        phoneNumber: '1234567890',
      });

      const error = user.validateSync();
      expect(error.errors.email).toBeDefined();
    });

    it('should fail validation if phoneNumber is not 10 digits', () => {
      // Test to ensure validation fails for invalid phone numbers
      const user = new User({
        firstName: 'John',
        email: 'john.doe@example.com',
        phoneNumber: '12345',
      });

      const error = user.validateSync();
      expect(error.errors.phoneNumber).toBeDefined();
      expect(error.errors.phoneNumber.message).toBe('12345 is not a valid phone number!');
    });

    it('should allow null password', () => {
      // Test to ensure password can be null
      const user = new User({
        firstName: 'John',
        email: 'john.doe@example.com',
        phoneNumber: '1234567890',
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
      expect(user.password).toBeNull();
    });
  });
});