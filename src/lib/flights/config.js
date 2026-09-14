import { object, string } from 'yup';
import { FlightServiceError } from './errors.js';

const required = () => string().trim().required();
const schemas = {
  duffel: object({ DUFFEL_ACCESS_TOKEN: required().matches(/^duffel_test_\S+$/) }),
  travelport: object({
    TRAVELPORT_CLIENT_ID: required(),
    TRAVELPORT_CLIENT_SECRET: required(),
    TRAVELPORT_USERNAME: required(),
    TRAVELPORT_PASSWORD: string().required(),
    TRAVELPORT_PCC: required().matches(/^[a-zA-Z\d]{3,4}_\w{2}$/),
    TRAVELPORT_CONTENT_SOURCES: required().matches(/^(GDS|NDC)(,(GDS|NDC))?$/),
  }),
};

export function readFlightConfig(env = process.env) {
  const provider = env.FLIGHTS_PROVIDER;
  if (!Object.hasOwn(schemas, provider))
    throw new FlightServiceError('configuration', ['FLIGHTS_PROVIDER']);
  try {
    const settings = schemas[provider].validateSync(
      {
        ...env,
        TRAVELPORT_CONTENT_SOURCES: env.TRAVELPORT_CONTENT_SOURCES ?? 'GDS,NDC',
      },
      { abortEarly: false, stripUnknown: true },
    );

    return { provider, settings };
  } catch (error) {
    throw new FlightServiceError('configuration', [
      ...new Set(error.inner.map((issue) => issue.path)),
    ]);
  }
}
