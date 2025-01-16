const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');
const authController = require('./auth');
const User = require('../models/User');
const { sendEmail, createHash, attchCookieToResponse, createOTP, userData } = require('../utils');

const app = express();
app.use(express.json());
app.post('/register', authController.register);
app.post('/verify-email', authController.verifyEmail);
app.post('/login', authController.login);
app.put('/update-user', authController.updateUser);
app.post('/send-reset-password-email', authController.sendResetPasswordEmail);
app.post('/reset-password', authController.resetPassword);
app.get('/show-current-user', authController.showCurrentUser);
app.post('/logout', authController.logout);

jest.mock('../models/User');
jest.mock('../utils');
jest.mock('../errors');

describe('Auth Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new user and send OTP', async () => {
            User.findOne.mockResolvedValue(null);
            User.create.mockResolvedValue({ save: jest.fn() });
            createOTP.OTP.mockReturnValue('123456');
            createOTP.expiresAt.mockReturnValue(new Date(Date.now() + 3600000));
            sendEmail.mockResolvedValue(true);

            const res = await request(app)
                .post('/register')
                .send({ email: 'test@example.com', password: 'password' });

            expect(res.status).toBe(StatusCodes.CREATED);
            expect(res.body.msg).toBe('check your mail to verify email');
        });

        it('should return error if email already exists and OTP is not expired', async () => {
            User.findOne.mockResolvedValue({
                verifyEmailOtp: { code: '123456', expiresAt: new Date(Date.now() + 3600000) }
            });

            const res = await request(app)
                .post('/register')
                .send({ email: 'test@example.com', password: 'password' });

            expect(res.status).toBe(StatusCodes.ACCEPTED);
            expect(res.body.message).toBe('email verification otp sent check your email');
        });
    });

    describe('verifyEmail', () => {
        it('should verify email with correct OTP', async () => {
            User.findOne.mockResolvedValue({
                verifyEmailOtp: { code: '123456', expiresAt: new Date(Date.now() + 3600000) },
                save: jest.fn(),
                createToken: jest.fn().mockReturnValue('token')
            });

            const res = await request(app)
                .post('/verify-email')
                .send({ email: 'test@example.com', otp: '123456' });

            expect(res.status).toBe(StatusCodes.OK);
            expect(res.body.msg).toBe('Email has been verified');
        });

        it('should return error if OTP is invalid', async () => {
            User.findOne.mockResolvedValue({
                verifyEmailOtp: { code: '123456', expiresAt: new Date(Date.now() + 3600000) }
            });

            const res = await request(app)
                .post('/verify-email')
                .send({ email: 'test@example.com', otp: '654321' });

            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
            expect(res.body.msg).toBe('Invalid OTP');
        });
    });

    describe('login', () => {
        it('should login user with correct credentials', async () => {
            User.findOne.mockResolvedValue({
                isEmailVerified: true,
                comparePassword: jest.fn().mockResolvedValue(true),
                createToken: jest.fn().mockReturnValue('token')
            });

            const res = await request(app)
                .post('/login')
                .send({ email: 'test@example.com', password: 'password' });

            expect(res.status).toBe(StatusCodes.OK);
            expect(res.body.user).toBeDefined();
        });

        it('should return error if email is not verified', async () => {
            User.findOne.mockResolvedValue({
                isEmailVerified: false
            });

            const res = await request(app)
                .post('/login')
                .send({ email: 'test@example.com', password: 'password' });

            expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
            expect(res.body.msg).toBe('Email is not verified please check your email');
        });
    });

    describe('updateUser', () => {
        it('should update user name', async () => {
            const userID = new mongoose.Types.ObjectId();
            const user = { _id: userID, name: 'newName', save: jest.fn() };
            User.findByIdAndUpdate.mockResolvedValue(user);

            const res = await request(app)
                .put('/update-user')
                .send({ name: 'newName' })
                .set('user', { userID });

            expect(res.status).toBe(StatusCodes.OK);
            expect(res.body.user.name).toBe('newName');
        });
    });

    describe('sendResetPasswordEmail', () => {
        it('should send reset password email', async () => {
            User.findOne.mockResolvedValue({
                resetPasswordToken: { code: null, expiresAt: null },
                save: jest.fn()
            });
            sendEmail.mockResolvedValue(true);

            const res = await request(app)
                .post('/send-reset-password-email')
                .send({ email: 'test@example.com' });

            expect(res.status).toBe(StatusCodes.OK);
            expect(res.body.msg).toBe('please check your email verification code has been sent');
        });
    });

    describe('resetPassword', () => {
        it('should reset password with valid token', async () => {
            User.findOne.mockResolvedValue({
                resetPasswordToken: { code: createHash('validToken'), expiresAt: new Date(Date.now() + 3600000) },
                save: jest.fn(),
                createToken: jest.fn().mockReturnValue('token')
            });

            const res = await request(app)
                .post('/reset-password')
                .send({ email: 'test@example.com', token: 'validToken', password: 'newPassword' });

            expect(res.status).toBe(StatusCodes.OK);
            expect(res.body.msg).toBe('password has been changed');
        });

        it('should return error if token is invalid', async () => {
            User.findOne.mockResolvedValue({
                resetPasswordToken: { code: createHash('validToken'), expiresAt: new Date(Date.now() + 3600000) }
            });

            const res = await request(app)
                .post('/reset-password')
                .send({ email: 'test@example.com', token: 'invalidToken', password: 'newPassword' });

            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
            expect(res.body.msg).toBe('invalid token!!');
        });
    });

    describe('showCurrentUser', () => {
        it('should show current user', async () => {
            const userID = new mongoose.Types.ObjectId();
            const user = { _id: userID, name: 'testUser' };
            User.findById.mockResolvedValue(user);

            const res = await request(app)
                .get('/show-current-user')
                .set('user', { userID });

            expect(res.status).toBe(StatusCodes.OK);
            expect(res.body.user.name).toBe('testUser');
        });
    });

    describe('logout', () => {
        it('should logout user', async () => {
            const res = await request(app)
                .post('/logout');

            expect(res.status).toBe(StatusCodes.OK);
            expect(res.body.msg).toBe('log out successfully');
        });
    });
});