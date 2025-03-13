
import jwt from "jsonwebtoken";
import { sendResponse } from "../../Common/common.js";
import { RESPONSE_CODE, RESPONSE_FAILURE } from "../../Common/constant.js";
import { BusinessOwner } from "../../Models/BusinessOwnerModel.js";
import { User } from "../../Models/UserModel.js";
import { validJWTNeeded } from '../auth.middleware';


jest.mock("../../Common/common.js");
jest.mock("jsonwebtoken");
jest.mock("../../Models/UserModel.js");
jest.mock("../../Models/BusinessOwnerModel.js");

describe('validJWTNeeded() validJWTNeeded method', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {};
    next = jest.fn();
  });

  describe('Happy Paths', () => {
    it('should call next if a valid user token is provided', async () => {
      // Arrange
      req.headers.authorization = 'Bearer validUserToken';
      const decodedToken = { user: { id: 'userId' } };
      jwt.verify.mockReturnValue(decodedToken);
      User.findById.mockResolvedValue({ id: 'userId' });

      // Act
      await validJWTNeeded(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('validUserToken', process.env.JWT_SECRET);
      expect(User.findById).toHaveBeenCalledWith('userId');
      expect(req.user).toEqual(decodedToken.user);
      expect(next).toHaveBeenCalled();
    });

    it('should call next if a valid business owner token is provided', async () => {
      // Arrange
      req.headers.authorization = 'Bearer validBusinessOwnerToken';
      const decodedToken = { businessOwner: { id: 'businessOwnerId' } };
      jwt.verify.mockReturnValue(decodedToken);
      BusinessOwner.findById.mockResolvedValue({ id: 'businessOwnerId' });

      // Act
      await validJWTNeeded(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('validBusinessOwnerToken', process.env.JWT_SECRET);
      expect(BusinessOwner.findById).toHaveBeenCalledWith('businessOwnerId');
      expect(req.user).toEqual(decodedToken.businessOwner);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should return unauthorized if no authorization header is present', async () => {
      // Act
      await validJWTNeeded(req, res, next);

      // Assert
      expect(sendResponse).toHaveBeenCalledWith(res, {}, 'You must login first', RESPONSE_FAILURE, RESPONSE_CODE.UNAUTHORIZED);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return unauthorized if authorization header does not start with Bearer', async () => {
      // Arrange
      req.headers.authorization = 'InvalidToken';

      // Act
      await validJWTNeeded(req, res, next);

      // Assert
      expect(sendResponse).toHaveBeenCalledWith(res, {}, 'You must login first', RESPONSE_FAILURE, RESPONSE_CODE.UNAUTHORIZED);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return invalid token if user is not found', async () => {
      // Arrange
      req.headers.authorization = 'Bearer validUserToken';
      const decodedToken = { user: { id: 'userId' } };
      jwt.verify.mockReturnValue(decodedToken);
      User.findById.mockResolvedValue(null);

      // Act
      await validJWTNeeded(req, res, next);

      // Assert
      expect(sendResponse).toHaveBeenCalledWith(res, {}, 'Invalid token', RESPONSE_FAILURE, RESPONSE_CODE.INVALID_TOKEN);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return unauthorized if token verification fails', async () => {
      // Arrange
      req.headers.authorization = 'Bearer invalidToken';
      jwt.verify.mockImplementation(() => {
        throw new Error('Token verification failed');
      });

      // Act
      await validJWTNeeded(req, res, next);

      // Assert
      expect(sendResponse).toHaveBeenCalledWith(res, [new Error('Token verification failed')], 'Token not verified', RESPONSE_FAILURE, RESPONSE_CODE.UNAUTHORIZED);
      expect(next).not.toHaveBeenCalled();
    });
  });
});