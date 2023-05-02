import Web3 from "web3";
import { Contract } from "web3-eth-contract";
import { AbiItem } from "web3-utils";
import contractABI from "./res/contractABI.json";

export class Web3Provider {
  private static instance: Web3Provider;
  web3: Web3;
  contract: Contract;
  abi: AbiItem[] = <AbiItem[]>contractABI;
  chainId: Number;

  constructor() {
    this.web3 = new Web3("https://bsc-dataseed1.binance.org/");
    this.contract = new this.web3.eth.Contract(this.abi, "0xc9F89E14B8b21A21e9359299047d333BFC6EFEb3");
  }

  public static getInstance(): Web3Provider {
    if (!Web3Provider.instance) {
      Web3Provider.instance = new Web3Provider();
    }
    return Web3Provider.instance;
  }

  public initialize(provider: string, contractAddress: string): void {
    this.web3 = new Web3(provider);
    this.contract = new this.web3.eth.Contract(this.abi, contractAddress);
    this.web3.eth.getChainId().then((providerChainId) => (this.chainId = providerChainId));
  }

  public getContract(): Contract {
    return this.contract;
  }

  public getChainId(): Number {
    return this.chainId;
  }
}
