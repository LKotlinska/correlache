import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from './user.dto.js';

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
