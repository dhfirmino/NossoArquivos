'use strict';

/**
 * OpenTelemetry tracing para SigNoz (self-hosted).
 * Só inicia o SDK quando OTEL_EXPORTER_OTLP_ENDPOINT estiver definido.
 * Exporta TRACES via OTLP HTTP para o SigNoz.
 * LOGS são exportados pelo pino-opentelemetry-transport (configurado em src/logger.js).
 */

const process = require('process');

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();
const useOtlp = process.env.OTEL_TRACES_EXPORTER === 'otlp';

if (!endpoint || !useOtlp) {
  return;
}

const opentelemetry = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { resourceFromAttributes } = require('@opentelemetry/resources');

const serviceName = process.env.OTEL_SERVICE_NAME || 'nossoarquivos';
const baseEndpoint = endpoint.replace(/\/$/, '');

const traceExporter = new OTLPTraceExporter({
  url: endpoint.includes('/v1/traces') ? endpoint : `${baseEndpoint}/v1/traces`,
});

const sdk = new opentelemetry.NodeSDK({
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
  resource: resourceFromAttributes({
    'service.name': serviceName,
  }),
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((err) => console.error('Error terminating tracing', err))
    .finally(() => process.exit(0));
});
