/* eslint-disable @typescript-eslint/camelcase */
import { dockerConfigs } from 'utils/constants';
/* eslint-disable no-template-curly-in-string */
import { ComposeService } from './composeFile';

// simple function to remove all line-breaks and extra white-space inside of a string
const trimInside = (text: string): string => text.replace(/\s+/g, ' ').trim();

export const bitcoind = (
  name: string,
  container: string,
  version: string,
  rpcPort: number,
  zmqBlockPort: number,
  zmqTxPort: number,
  command: string,
): ComposeService => ({
  image: `polarlightning/bitcoind:${version}`,
  container_name: container,
  environment: {
    USERID: '${USERID:-1000}',
    GROUPID: '${GROUPID:-1000}',
  },
  hostname: name,
  command: trimInside(command),
  volumes: [
    `./volumes/${dockerConfigs.bitcoind.volumeDirName}/${name}:/home/bitcoin/.bitcoin`,
  ],
  expose: [
    '18443', // RPC
    '18444', // p2p
    '28334', // ZMQ blocks
    '28335', // ZMQ txns
  ],
  ports: [
    `${rpcPort}:18443`, // RPC
    `${zmqBlockPort}:28334`, // ZMQ blocks
    `${zmqTxPort}:28335`, // ZMQ txns
  ],
});

export const lnd = (
  name: string,
  container: string,
  version: string,
  restPort: number,
  grpcPort: number,
  p2pPort: number,
  command: string,
): ComposeService => ({
  image: `polarlightning/lnd:${version}`,
  container_name: container,
  environment: {
    USERID: '${USERID:-1000}',
    GROUPID: '${GROUPID:-1000}',
  },
  hostname: name,
  command: trimInside(command),
  restart: 'always',
  volumes: [`./volumes/${dockerConfigs.LND.volumeDirName}/${name}:/home/lnd/.lnd`],
  expose: [
    '8080', // REST
    '10009', // gRPC
    '9735', // p2p
  ],
  ports: [
    `${restPort}:8080`, // REST
    `${grpcPort}:10009`, // gRPC
    `${p2pPort}:9735`, // p2p
  ],
});

export const clightning = (
  name: string,
  container: string,
  version: string,
  restPort: number,
  p2pPort: number,
  command: string,
): ComposeService => ({
  image: `polarlightning/clightning:${version}`,
  container_name: container,
  environment: {
    USERID: '${USERID:-1000}',
    GROUPID: '${GROUPID:-1000}',
  },
  hostname: name,
  command: trimInside(command),
  restart: 'always',
  volumes: [
    `./volumes/${dockerConfigs['c-lightning'].volumeDirName}/${name}/${dockerConfigs['c-lightning'].dataDir}:/home/clightning/.lightning`,
    `./volumes/${dockerConfigs['c-lightning'].volumeDirName}/${name}/${dockerConfigs['c-lightning'].apiDir}:/opt/c-lightning-rest/certs`,
  ],
  expose: [
    '8080', // REST
    '9735', // p2p
  ],
  ports: [
    `${restPort}:8080`, // REST
    `${p2pPort}:9735`, // p2p
  ],
});
