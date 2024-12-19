import '../core/version/config';

import { Controller, Get, HttpStatus, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import ava, { TestFn } from 'ava';
import request from 'supertest';

import { AppModule } from '../app.module';
import { Runtime, UseNamedGuard } from '../base';
import { Public } from '../core/auth/guard';
import { createTestingApp, initTestingDB } from './utils';

const test = ava as TestFn<{
  runtime: Runtime;
  cookie: string;
  app: INestApplication;
}>;

@Public()
@Controller('/guarded')
class GuardedController {
  @UseNamedGuard('version')
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
  // reset runtime
  await t.context.runtime.loadDb('version/enable');
  await t.context.runtime.loadDb('version/minVersion');
  await t.context.runtime.set('version/enable', false);
  await t.context.runtime.set('version/minVersion', '0.0.0');
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
  const res = await req.expect(status);
  if (res.body.message) {
    throw new Error(res.body.message);
  }
  return res;
}

test('should be able to prevent requests if version outdated', async t => {
  const { app, runtime } = t.context;

  {
    await runtime.set('version/enable', false);
    await t.notThrowsAsync(
      fetchWithVersion(app.getHttpServer(), undefined, HttpStatus.OK),
      'should not check version if disabled'
    );
  }

  {
    await runtime.set('version/enable', true);
    await t.throwsAsync(
      fetchWithVersion(app.getHttpServer(), undefined, HttpStatus.FORBIDDEN),
      { message: 'Unsupported client version. Please upgrade to 0.0.0.' },
      'should check version exists'
    );
    await t.notThrowsAsync(
      fetchWithVersion(app.getHttpServer(), '0.0.0', HttpStatus.OK),
      'should check version exists'
    );
  }

  {
    await runtime.set('version/minVersion', 'unknownVersion');
    await t.notThrowsAsync(
      fetchWithVersion(app.getHttpServer(), undefined, HttpStatus.OK),
      'should not check version if invalid minVersion provided'
    );
    await t.notThrowsAsync(
      fetchWithVersion(app.getHttpServer(), '0.0.0', HttpStatus.OK),
      'should not check version if invalid minVersion provided'
    );

    await runtime.set('version/minVersion', '0.0.1');
    await t.throwsAsync(
      fetchWithVersion(app.getHttpServer(), '0.0.0', HttpStatus.FORBIDDEN),
      { message: 'Unsupported client version. Please upgrade to 0.0.1.' },
      'should reject version if valid minVersion provided'
    );

    await runtime.set('version/minVersion', '0.0.5 || >=0.0.7');
    await t.notThrowsAsync(
      fetchWithVersion(app.getHttpServer(), '0.0.5', HttpStatus.OK),
      'should pass version if version satisfies minVersion'
    );
    await t.throwsAsync(
      fetchWithVersion(app.getHttpServer(), '0.0.6', HttpStatus.FORBIDDEN),
      { message: 'Unsupported client version. Please upgrade to 0.0.7.' },
      'should reject version if valid minVersion provided'
    );
    await t.notThrowsAsync(
      fetchWithVersion(app.getHttpServer(), '0.1.0', HttpStatus.OK),
      'should pass version if version satisfies minVersion'
    );
  }
});
