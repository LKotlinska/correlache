import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { ExportService } from './export.service.js';
import { HistorySummaryService } from './history-summary.service.js';
import { User } from './entities/user.entity.js';

describe('UserController', () => {
  let controller: UserController;
  const userService = { giveConsent: vi.fn() };
  const exportService = { exportUser: vi.fn() };
  const historySummaryService = { summarize: vi.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: ExportService, useValue: exportService },
        { provide: HistorySummaryService, useValue: historySummaryService },
      ],
    })
      // The real guard needs ThrottlerModule's storage; its behaviour belongs to e2e tests.
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('records health data consent for the current user', async () => {
    userService.giveConsent.mockResolvedValue(undefined);

    await controller.giveConsent({ id: 'uuid-1' } as User, { healthDataConsent: true });

    expect(userService.giveConsent).toHaveBeenCalledWith('uuid-1');
  });

  it('summarizes the current user\'s history', async () => {
    const summary = { headaches: { count: 2, firstStartedAt: new Date('2026-01-01') }, workouts: { count: 0, firstStartedAt: null } };
    historySummaryService.summarize.mockResolvedValue(summary);

    await expect(controller.history({ id: 'uuid-1' } as User)).resolves.toBe(summary);
    expect(historySummaryService.summarize).toHaveBeenCalledWith('uuid-1');
  });

  it('sends the export as a JSON attachment', async () => {
    const data = { exportedAt: '2026-11-10T12:00:00.000Z', account: { id: 'uuid-1' } };
    exportService.exportUser.mockResolvedValue(data);
    const res = { setHeader: vi.fn() };

    const result = await controller.exportMe({ id: 'uuid-1' } as User, res as never);

    expect(exportService.exportUser).toHaveBeenCalledWith('uuid-1');
    expect(result).toBe(data);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="correlache-export.json"');
  });
});
