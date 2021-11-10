import Web3 from "web3";
import { Contract } from "web3-eth-contract";
import { AbiItem } from "web3-utils";
import contractABI from "./res/contractABI.json";

export class Web3Provider {
  private static instance: Web3Provider;
  web3: Web3;
  contract: Contract;
  abi: AbiItem[] = <AbiItem[]>contractABI;

  constructor() {
    this.web3 = new Web3("https://data-seed-prebsc-1-s1.binance.org:8545/");
    this.contract = new this.web3.eth.Contract(this.abi, "0x6828adf1aED03be429eE42053a4F72CDd3c70846");
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
  }

  public getContract(): Contract {
    return this.contract;
  }
}
