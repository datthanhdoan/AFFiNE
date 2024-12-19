import '../core/version/config';

import { Controller, Get, HttpStatus, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import ava, { TestFn } from 'ava';
import request from 'supertest';

import { AppModule } from '../app.module';
import { Runtime, UseNamedGuard } from '../base';
import { createTestingApp, initTestingDB } from './utils';

const test = ava as TestFn<{
  runtime: Runtime;
  cookie: string;
  app: INestApplication;
}>;

@UseNamedGuard()
@Controller('/guarded')
class GuardedController {
  @Get('/test')
  test() {
    return 'test';
  }
}

test.before(async t => {
  const { app } = await createTestingApp({
    imports: [AppModule],
    controllers: [GuardedController],
  });

  t.context.runtime = app.get(Runtime);
  t.context.app = app;
});

test.beforeEach(async t => {
  await initTestingDB(t.context.app.get(PrismaClient));
});

test.after.always(async t => {
  await t.context.app.close();
});

async function fetchWithVersion(
  server: any,
  version: string | undefined,
  status: number
) {
  let req = request(server).get('/guarded/test');
  if (version) {
    req = req.set({ 'x-affine-version': version });
  }
  return req.expect(status);
}

test('should be able to prevent requests if version outdated', async t => {
  const { app, runtime } = t.context;

  {
    await runtime.set('version/enable', false);
    t.notThrowsAsync(
      fetchWithVersion(app.getHttpServer(), undefined, HttpStatus.OK),
      'should not check version if disabled'
    );
  }

  {
    await runtime.set('version/enable', true);
    t.notThrowsAsync(
      fetchWithVersion(app.getHttpServer(), undefined, HttpStatus.OK),
      'should not check version if disabled'
    );
  }

  {
    await runtime.set('version/minVersion', 'unknownVersion');
    t.notThrowsAsync(
      fetchWithVersion(app.getHttpServer(), '0.0.0', HttpStatus.OK),
      'should not check version if invalid minVersion provided'
    );

    await runtime.set('version/minVersion', '0.0.1');
    t.throwsAsync(
      fetchWithVersion(app.getHttpServer(), '0.0.0', HttpStatus.FORBIDDEN),
      { message: 'Version outdated' },
      'should check version if valid minVersion provided'
    );
  }
});
