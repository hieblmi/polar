import { BitcoinNode, CLightningNode, CommonNode, LndNode } from 'shared/types';
import { bitcoinCredentials, dockerConfigs } from 'utils/constants';
import { getContainerName } from 'utils/network';
/* eslint-disable @typescript-eslint/camelcase */
import { bitcoind, clightning, lnd } from './nodeTemplates';

export interface ComposeService {
  image: string;
  container_name: string;
  environment: Record<string, string>;
  hostname: string;
  command: string;
  volumes: string[];
  expose: string[];
  ports: string[];
  restart?: 'always';
}

export interface ComposeContent {
  version: string;
  services: {
    [key: string]: ComposeService;
  };
}

class ComposeFile {
  content: ComposeContent;

  constructor() {
    this.content = {
      version: '3.3',
      services: {},
    };
  }

  addBitcoind(node: BitcoinNode) {
    const { name, version, ports } = node;
    const { rpc, zmqBlock, zmqTx } = ports;
    const container = getContainerName(node);
    // define the variable substitutions
    const variables = {
      rpcUser: bitcoinCredentials.user,
      rpcAuth: bitcoinCredentials.rpcauth,
    };
    // use the node's custom command of the default for the implementation
    const nodeCommand = node.docker.command || dockerConfigs.bitcoind.command;
    // replace the variables in the command
    const command = this.mergeCommand(nodeCommand, variables);
    // add the docker service
    this.content.services[name] = bitcoind(
      name,
      container,
      version,
      rpc,
      zmqBlock,
      zmqTx,
      command,
    );
  }

  addLnd(node: LndNode, backend: CommonNode) {
    const { name, version, ports } = node;
    const { rest, grpc, p2p } = ports;
    const container = getContainerName(node);
    // define the variable substitutions
    const variables = {
      name: node.name,
      backendName: getContainerName(backend),
      rpcUser: bitcoinCredentials.user,
      rpcPass: bitcoinCredentials.pass,
    };
    // use the node's custom command of the default for the implementation
    const nodeCommand = node.docker.command || dockerConfigs.LND.command;
    // replace the variables in the command
    const command = this.mergeCommand(nodeCommand, variables);
    // add the docker service
    this.content.services[name] = lnd(name, container, version, rest, grpc, p2p, command);
  }

  addClightning(node: CLightningNode, backend: CommonNode) {
    const { name, version, ports } = node;
    const { rest, p2p } = ports;
    const container = getContainerName(node);
    // define the variable substitutions
    const variables = {
      name: node.name,
      backendName: getContainerName(backend),
      rpcUser: bitcoinCredentials.user,
      rpcPass: bitcoinCredentials.pass,
    };
    // use the node's custom command of the default for the implementation
    const nodeCommand = node.docker.command || dockerConfigs['c-lightning'].command;
    // replace the variables in the command
    const command = this.mergeCommand(nodeCommand, variables);
    // add the docker service
    this.content.services[name] = clightning(
      name,
      container,
      version,
      rest,
      p2p,
      command,
    );
  }

  private mergeCommand(command: string, variables: Record<string, string>) {
    let merged = command;
    Object.keys(variables).forEach(key => {
      // intentionally not using .replace() because if a string is passed in, then only the first occurrence
      // is replaced. A RegExp could be used but the code would be more confusing because of escape chars
      merged = merged.split(`{{${key}}}`).join(variables[key]);
    });
    return merged;
  }
}

export default ComposeFile;
