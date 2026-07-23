import { loadApiClients, parseGatewayConfig } from './config';
import { createOfficeGateway } from './gateway';

async function main() {
  const config = parseGatewayConfig(process.env);
  const clients = await loadApiClients(config.apiClientsFile);
  const configuredPadding = Number(process.env.OFFICE_FALLBACK_PADDING_MS);
  const gateway = createOfficeGateway({
    config,
    clients,
    ...(Number.isFinite(configuredPadding) && configuredPadding >= 0 ? { fallbackPaddingMs: configuredPadding } : {}),
  });
  const address = await gateway.start();
  process.stdout.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', result: 'gateway_started', host: address.host, port: address.port })}\n`);

  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    await gateway.close();
  };
  process.once('SIGINT', () => { void shutdown().then(() => process.exit(0)); });
  process.once('SIGTERM', () => { void shutdown().then(() => process.exit(0)); });
}

main().catch((reason) => {
  const message = reason instanceof Error ? reason.message : 'Unknown startup error';
  process.stderr.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', result: 'gateway_start_failed', reasonCode: 'invalid_startup_configuration', message })}\n`);
  process.exitCode = 1;
});
