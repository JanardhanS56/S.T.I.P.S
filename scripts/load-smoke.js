process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'silent';
import autocannon from 'autocannon';
import http from 'node:http';
import app from '../server/app.js';

export async function runLoadSmoke(options = {}) {
  let server;
  let targetUrl = options.url || process.env.TARGET_URL;

  if (!targetUrl) {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    targetUrl = `http://127.0.0.1:${port}`;
  }

  console.log('='.repeat(55));
  console.log(`  S.T.I.P.S Load Smoke Benchmark (PERF-02)`);
  console.log(`  Target: ${targetUrl}/api/health`);
  console.log(`  Connections: 10, Duration: 5s`);
  console.log('='.repeat(55));

  try {
    const result = await autocannon({
      url: `${targetUrl}/api/health`,
      connections: options.connections || 10,
      duration: options.duration || 5,
      pipelining: 1
    });

    console.log('\n--- Benchmark Results ---');
    console.log(`• Requests Total:     ${result.requests.total}`);
    console.log(`• Throughput (req/s):  ${result.requests.average}`);
    console.log(`• Latency Avg:        ${result.latency.average} ms`);
    console.log(`• Latency p50:        ${result.latency.p50} ms`);
    console.log(`• Latency p95:        ${result.latency.p95} ms`);
    console.log(`• Latency p99:        ${result.latency.p99} ms`);
    console.log(`• 2xx Responses:      ${result['2xx']}`);
    console.log(`• Non-2xx Responses:  ${result.non2xx}`);
    console.log(`• Errors / Timeouts:  ${result.errors} / ${result.timeouts}`);
    console.log('-------------------------\n');

    return result;
  } finally {
    if (server) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      await new Promise((resolve) => server.close(resolve));
    }
  }
}

const isDirect =
  process.argv[1] &&
  (process.argv[1].endsWith('load-smoke.js') || process.argv[1].includes('load-smoke'));
if (isDirect) {
  runLoadSmoke()
    .then((res) => {
      if (res.errors > 0 || res.timeouts > 0) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
