import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto, GiveConsentDto } from './user.dto.js';

describe('CreateUserDto', () => {
  const valid = { name: 'Jane', email: 'jane@example.com', password: 'supersecret', healthDataConsent: true };

  const errorsFor = async (body: object) => {
    const errors = await validate(plainToInstance(CreateUserDto, body));
    return errors.map((e) => e.property);
  };

  it('accepts a signup with explicit health data consent', async () => {
    expect(await errorsFor(valid)).toEqual([]);
  });

  it.each([
    ['missing', undefined],
    ['false', false],
    ['the string "true"', 'true'],
    ['1', 1],
  ])('rejects health data consent that is %s', async (_label, value) => {
    expect(await errorsFor({ ...valid, healthDataConsent: value })).toEqual(['healthDataConsent']);
  });
});

describe('GiveConsentDto', () => {
  const errorsFor = async (body: object) =>
    (await validate(plainToInstance(GiveConsentDto, body))).map((e) => e.property);

  it('accepts explicit consent', async () => {
    expect(await errorsFor({ healthDataConsent: true })).toEqual([]);
  });

  it.each([
    ['an empty body', {}],
    ['false', { healthDataConsent: false }],
    ['the string "true"', { healthDataConsent: 'true' }],
  ])('rejects %s', async (_label, body) => {
    expect(await errorsFor(body)).toEqual(['healthDataConsent']);
  });
});
